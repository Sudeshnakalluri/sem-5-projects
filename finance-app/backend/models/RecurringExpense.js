const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RecurringExpense = sequelize.define(
  "RecurringExpense",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    type: { type: DataTypes.ENUM("income", "expense"), defaultValue: "expense" },
    frequency: {
      type: DataTypes.ENUM("daily", "weekly", "monthly", "yearly"),
      defaultValue: "monthly",
    },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    nextDueDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    autoAdd: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "recurring_expenses" }
);

module.exports = RecurringExpense;
