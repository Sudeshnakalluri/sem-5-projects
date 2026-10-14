const express = require("express");
const { body, validationResult } = require("express-validator");
const { User, Category } = require("../models");
const generateToken = require("../utils/generateToken");
const { protect } = require("../middleware/auth");

const router = express.Router();

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "income", color: "#2FBF9F", icon: "briefcase" },
  { name: "Freelance", type: "income", color: "#4C6FFF", icon: "laptop" },
  { name: "Investments", type: "income", color: "#D4AF37", icon: "trending-up" },
  { name: "Other Income", type: "income", color: "#8B5CF6", icon: "plus-circle" },
  { name: "Food & Dining", type: "expense", color: "#F4623A", icon: "utensils" },
  { name: "Transportation", type: "expense", color: "#F4A623", icon: "car" },
  { name: "Housing & Rent", type: "expense", color: "#E85D75", icon: "home" },
  { name: "Utilities", type: "expense", color: "#5B8DEF", icon: "zap" },
  { name: "Entertainment", type: "expense", color: "#9B59B6", icon: "film" },
  { name: "Healthcare", type: "expense", color: "#EF4444", icon: "heart" },
  { name: "Shopping", type: "expense", color: "#EC4899", icon: "shopping-bag" },
  { name: "Education", type: "expense", color: "#06B6D4", icon: "book" },
  { name: "Other Expense", type: "expense", color: "#6B7280", icon: "more-horizontal" },
];

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;
      const existing = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const user = await User.create({ name, email: email.toLowerCase(), password });

      await Category.bulkCreate(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id, isDefault: true }))
      );

      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatarColor: user.avatarColor,
        token: generateToken(user.id),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        monthlyIncomeGoal: user.monthlyIncomeGoal,
        avatarColor: user.avatarColor,
        token: generateToken(user.id),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/me", protect, async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    currency: req.user.currency,
    monthlyIncomeGoal: req.user.monthlyIncomeGoal,
    avatarColor: req.user.avatarColor,
  });
});

router.put("/profile", protect, async (req, res, next) => {
  try {
    const { name, currency, monthlyIncomeGoal, avatarColor } = req.body;
    if (name !== undefined) req.user.name = name;
    if (currency !== undefined) req.user.currency = currency;
    if (monthlyIncomeGoal !== undefined) req.user.monthlyIncomeGoal = monthlyIncomeGoal;
    if (avatarColor !== undefined) req.user.avatarColor = avatarColor;
    await req.user.save();
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      currency: req.user.currency,
      monthlyIncomeGoal: req.user.monthlyIncomeGoal,
      avatarColor: req.user.avatarColor,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
