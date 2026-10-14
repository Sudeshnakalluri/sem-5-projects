const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Budget = sequelize.define(
  "Budget",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    month: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
    year: { type: DataTypes.INTEGER, allowNull: false },
    limitAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: "limit_amount" },
    notifyAtPercent: { type: DataTypes.INTEGER, defaultValue: 80 },
  },
  {
    tableName: "budgets",
    indexes: [{ unique: true, fields: ["user_id", "category_id", "month", "year"] }],
  }
);

module.exports = Budget;
