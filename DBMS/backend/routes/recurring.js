const express = require("express");
const { RecurringExpense, Category, Transaction } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

const advanceDate = (date, frequency) => {
  const d = new Date(date);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().slice(0, 10);
};

router.get("/", async (req, res, next) => {
  try {
    const items = await RecurringExpense.findAll({
      where: { userId: req.user.id },
      include: [{ model: Category, as: "category", attributes: ["id", "name", "color", "icon", "type"] }],
      order: [["nextDueDate", "ASC"]],
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, amount, category, type, frequency, startDate } = req.body;
    if (!title || !amount || !category) {
      return res.status(400).json({ message: "title, amount and category are required" });
    }
    const start = startDate || new Date().toISOString().slice(0, 10);
    const item = await RecurringExpense.create({
      userId: req.user.id,
      categoryId: category,
      title,
      amount,
      type: type || "expense",
      frequency: frequency || "monthly",
      startDate: start,
      nextDueDate: start,
    });
    const populated = await RecurringExpense.findByPk(item.id, {
      include: [{ model: Category, as: "category", attributes: ["id", "name", "color", "icon", "type"] }],
    });
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const item = await RecurringExpense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ message: "Recurring expense not found" });
    const fields = ["title", "amount", "frequency", "endDate", "isActive", "autoAdd"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });
    if (req.body.category !== undefined) item.categoryId = req.body.category;
    if (req.body.type !== undefined) item.type = req.body.type;
    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/process", async (req, res, next) => {
  try {
    const item = await RecurringExpense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ message: "Recurring expense not found" });

    const transaction = await Transaction.create({
      userId: req.user.id,
      type: item.type,
      amount: item.amount,
      categoryId: item.categoryId,
      description: `${item.title} (recurring)`,
      date: item.nextDueDate,
      isRecurring: true,
      recurringExpenseId: item.id,
    });

    item.nextDueDate = advanceDate(item.nextDueDate, item.frequency);
    await item.save();

    res.json({ recurring: item, transaction });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const item = await RecurringExpense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ message: "Recurring expense not found" });
    await item.destroy();
    res.json({ message: "Recurring expense deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
