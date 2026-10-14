const express = require("express");
const { Category, Transaction } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const where = { userId: req.user.id };
    if (req.query.type) where.type = req.query.type;
    const categories = await Category.findAll({ where, order: [["name", "ASC"]] });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, type, color, icon } = req.body;
    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }
    const category = await Category.create({
      userId: req.user.id,
      name,
      type,
      color: color || "#4C6FFF",
      icon: icon || "tag",
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!category) return res.status(404).json({ message: "Category not found" });
    const { name, color, icon } = req.body;
    if (name !== undefined) category.name = name;
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;
    await category.save();
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category.isDefault) {
      return res.status(400).json({ message: "Default categories cannot be deleted" });
    }
    const inUse = await Transaction.count({ where: { categoryId: category.id } });
    if (inUse > 0) {
      return res.status(400).json({ message: "Cannot delete a category with existing transactions" });
    }
    await category.destroy();
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
