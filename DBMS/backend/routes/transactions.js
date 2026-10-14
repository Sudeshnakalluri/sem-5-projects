const express = require("express");
const { Op } = require("sequelize");
const { body, validationResult } = require("express-validator");
const { Transaction, Category } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const { type, category, from, to, search, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (category) where.categoryId = category;
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }
    if (search) where.description = { [Op.iLike]: `%${search}%` };

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);

    const { rows, count } = await Transaction.findAndCountAll({
      where,
      include: [{ model: Category, as: "category", attributes: ["id", "name", "color", "icon", "type"] }],
      order: [["date", "DESC"]],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });

    res.json({
      transactions: rows,
      total: count,
      page: pageNum,
      pages: Math.ceil(count / limitNum) || 1,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Category, as: "category", attributes: ["id", "name", "color", "icon", "type"] }],
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  [
    body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"),
    body("category").notEmpty().withMessage("Category is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { type, amount, category, description, date, paymentMethod, tags } = req.body;
      const transaction = await Transaction.create({
        userId: req.user.id,
        type,
        amount,
        categoryId: category,
        description,
        date: date || new Date().toISOString().slice(0, 10),
        paymentMethod,
        tags: Array.isArray(tags) ? tags.join(",") : tags || "",
      });
      const populated = await Transaction.findByPk(transaction.id, {
        include: [{ model: Category, as: "category", attributes: ["id", "name", "color", "icon", "type"] }],
      });
      res.status(201).json(populated);
    } catch (err) {
      next(err);
    }
  }
);

router.put("/:id", async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const { type, amount, category, description, date, paymentMethod, tags } = req.body;
    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = amount;
    if (category !== undefined) transaction.categoryId = category;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;
    if (tags !== undefined) transaction.tags = Array.isArray(tags) ? tags.join(",") : tags;

    await transaction.save();
    const populated = await Transaction.findByPk(transaction.id, {
      include: [{ model: Category, as: "category", attributes: ["id", "name", "color", "icon", "type"] }],
    });
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    await transaction.destroy();
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
