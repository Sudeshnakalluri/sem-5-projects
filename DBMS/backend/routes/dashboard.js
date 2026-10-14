const express = require("express");
const { QueryTypes } = require("sequelize");
const { sequelize, Transaction, Category, Goal } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

const monthRange = (month, year) => ({
  start: `${year}-${String(month).padStart(2, "0")}-01`,
  end: month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`,
});

// GET /api/dashboard/summary?month=&year=
router.get("/summary", async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();
    const { start, end } = monthRange(month, year);

    // Raw SQL: totals grouped by type
    const totals = await sequelize.query(
      `SELECT type, SUM(amount) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = :userId AND date >= :start AND date < :end
       GROUP BY type`,
      { replacements: { userId: req.user.id, start, end }, type: QueryTypes.SELECT }
    );

    let totalIncome = 0, totalExpense = 0, incomeCount = 0, expenseCount = 0;
    totals.forEach((t) => {
      if (t.type === "income") { totalIncome = parseFloat(t.total); incomeCount = t.count; }
      if (t.type === "expense") { totalExpense = parseFloat(t.total); expenseCount = t.count; }
    });

    // Raw SQL: highest spending category via JOIN + GROUP BY + ORDER BY + LIMIT
    const highest = await sequelize.query(
      `SELECT c.id, c.name, c.color, c.icon, SUM(t.amount) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = :userId AND t.type = 'expense' AND t.date >= :start AND t.date < :end
       GROUP BY c.id, c.name, c.color, c.icon
       ORDER BY total DESC
       LIMIT 1`,
      { replacements: { userId: req.user.id, start, end }, type: QueryTypes.SELECT }
    );

    const recentTransactions = await Transaction.findAll({
      where: { userId: req.user.id },
      include: [{ model: Category, as: "category", attributes: ["id", "name", "color", "icon", "type"] }],
      order: [["date", "DESC"]],
      limit: 6,
    });

    const goalsSummaryRows = await sequelize.query(
      `SELECT COALESCE(SUM(saved_amount),0) AS saved, COALESCE(SUM(target_amount),0) AS target
       FROM goals WHERE user_id = :userId AND status != 'abandoned'`,
      { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
    );

    res.json({
      month,
      year,
      totalIncome,
      totalExpense,
      remainingBalance: totalIncome - totalExpense,
      incomeCount,
      expenseCount,
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
      highestSpendingCategory: highest[0]
        ? { category: { name: highest[0].name, color: highest[0].color, icon: highest[0].icon }, total: parseFloat(highest[0].total) }
        : null,
      recentTransactions,
      goalsSummary: {
        saved: parseFloat(goalsSummaryRows[0]?.saved || 0),
        target: parseFloat(goalsSummaryRows[0]?.target || 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/category-breakdown?type=expense&month=&year=
router.get("/category-breakdown", async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();
    const type = req.query.type === "income" ? "income" : "expense";
    const { start, end } = monthRange(month, year);

    const breakdown = await sequelize.query(
      `SELECT c.id AS categoryId, c.name, c.color, c.icon, SUM(t.amount) AS total, COUNT(*) AS count
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = :userId AND t.type = :type AND t.date >= :start AND t.date < :end
       GROUP BY c.id, c.name, c.color, c.icon
       ORDER BY total DESC`,
      { replacements: { userId: req.user.id, type, start, end }, type: QueryTypes.SELECT }
    );

    res.json(breakdown.map((b) => ({ ...b, total: parseFloat(b.total) })));
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/trend?months=6
router.get("/trend", async (req, res, next) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 6, 24);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
      .toISOString()
      .slice(0, 10);

    const rows = await sequelize.query(
      `SELECT EXTRACT(YEAR FROM date)::int AS yr, EXTRACT(MONTH FROM date)::int AS mo, type, SUM(amount) AS total
       FROM transactions
       WHERE user_id = :userId AND date >= :start
       GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), type
       ORDER BY yr ASC, mo ASC`,
      { replacements: { userId: req.user.id, start }, type: QueryTypes.SELECT }
    );

    const map = {};
    rows.forEach((r) => {
      const key = `${r.yr}-${String(r.mo).padStart(2, "0")}`;
      if (!map[key]) map[key] = { period: key, income: 0, expense: 0 };
      map[key][r.type] = parseFloat(r.total);
    });

    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result.push(map[key] || { period: key, income: 0, expense: 0 });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/everything -> every row the user owns, joined and labeled (see all your data at once)
router.get("/everything", async (req, res, next) => {
  try {
    const [transactions, budgets, goals, recurring, categories] = await Promise.all([
      sequelize.query(
        `SELECT t.id, t.type, t.amount, t.description, t.date, t.payment_method,
                c.name AS category_name, c.type AS category_type
         FROM transactions t
         JOIN categories c ON c.id = t.category_id
         WHERE t.user_id = :userId
         ORDER BY t.date DESC`,
        { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT b.id, b.month, b.year, b.limit_amount, c.name AS category_name
         FROM budgets b
         JOIN categories c ON c.id = b.category_id
         WHERE b.user_id = :userId
         ORDER BY b.year DESC, b.month DESC`,
        { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT id, title, target_amount, saved_amount, status, target_date
         FROM goals WHERE user_id = :userId ORDER BY created_at DESC`,
        { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT r.id, r.title, r.amount, r.frequency, r.next_due_date, c.name AS category_name
         FROM recurring_expenses r
         JOIN categories c ON c.id = r.category_id
         WHERE r.user_id = :userId
         ORDER BY r.next_due_date ASC`,
        { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT id, name, type, color FROM categories WHERE user_id = :userId ORDER BY name ASC`,
        { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
      ),
    ]);

    res.json({ transactions, budgets, goals, recurring, categories });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
