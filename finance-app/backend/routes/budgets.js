const express = require("express");
const { QueryTypes } = require("sequelize");
const { sequelize, Budget, Category } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// GET /api/budgets?month=&year=
router.get("/", async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const budgets = await Budget.findAll({
      where: { userId: req.user.id, month, year },
      include: [{ model: Category, as: "category", attributes: ["id", "name", "color", "icon", "type"] }],
    });

    // Raw SQL: total spent per category this month, via JOIN + GROUP BY + SUM
    const spentRows = await sequelize.query(
      `
      SELECT category_id AS "categoryId", SUM(amount) AS spent
      FROM transactions
      WHERE user_id = :userId
        AND type = 'expense'
        AND date >= :start
        AND date < :end
      GROUP BY category_id
      `,
      {
        replacements: {
          userId: req.user.id,
          start: `${year}-${String(month).padStart(2, "0")}-01`,
          end: month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`,
        },
        type: QueryTypes.SELECT,
      }
    );

    const spentMap = {};
    spentRows.forEach((r) => {
      spentMap[r.categoryId] = parseFloat(r.spent);
    });

    const result = budgets.map((b) => {
      const spent = spentMap[b.categoryId] || 0;
      const limit = parseFloat(b.limitAmount);
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        _id: String(b.id),
        category: b.category,
        month: b.month,
        year: b.year,
        limit,
        notifyAtPercent: b.notifyAtPercent,
        spent,
        remaining: Math.max(limit - spent, 0),
        percentUsed: percent,
        isOverBudget: spent > limit,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/budgets  (upsert budget for category/month/year)
router.post("/", async (req, res, next) => {
  try {
    const { category, month, year, limit, notifyAtPercent } = req.body;
    if (!category || !month || !year || limit === undefined) {
      return res.status(400).json({ message: "category, month, year and limit are required" });
    }

    const [budget] = await Budget.findOrCreate({
      where: { userId: req.user.id, categoryId: category, month, year },
      defaults: { limitAmount: limit, notifyAtPercent: notifyAtPercent ?? 80 },
    });

    budget.limitAmount = limit;
    if (notifyAtPercent !== undefined) budget.notifyAtPercent = notifyAtPercent;
    await budget.save();

    const populated = await Budget.findByPk(budget.id, {
      include: [{ model: Category, as: "category", attributes: ["id", "name", "color", "icon", "type"] }],
    });
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ message: "Budget not found" });
    const { limit, notifyAtPercent } = req.body;
    if (limit !== undefined) budget.limitAmount = limit;
    if (notifyAtPercent !== undefined) budget.notifyAtPercent = notifyAtPercent;
    await budget.save();
    res.json(budget);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ message: "Budget not found" });
    await budget.destroy();
    res.json({ message: "Budget deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
