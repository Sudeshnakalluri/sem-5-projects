const express = require("express");
const { Goal, GoalContribution } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const goals = await Goal.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(goals);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, targetAmount, targetDate, icon, color } = req.body;
    if (!title || !targetAmount) {
      return res.status(400).json({ message: "Title and target amount are required" });
    }
    const goal = await Goal.create({
      userId: req.user.id,
      title,
      targetAmount,
      targetDate: targetDate || null,
      icon,
      color,
    });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    const fields = ["title", "targetAmount", "targetDate", "icon", "color", "status"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) goal[f] = req.body[f];
    });
    await goal.save();
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/contribute", async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    const { amount, note } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Contribution amount must be greater than 0" });
    }
    await GoalContribution.create({ goalId: goal.id, amount, note });
    goal.savedAmount = parseFloat(goal.savedAmount) + parseFloat(amount);
    if (parseFloat(goal.savedAmount) >= parseFloat(goal.targetAmount)) {
      goal.status = "completed";
    }
    await goal.save();
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    await goal.destroy();
    res.json({ message: "Goal deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
