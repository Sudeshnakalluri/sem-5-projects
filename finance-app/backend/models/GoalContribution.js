const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GoalContribution = sequelize.define(
  "GoalContribution",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    note: { type: DataTypes.STRING(200), defaultValue: "" },
  },
  { tableName: "goal_contributions" }
);

module.exports = GoalContribution;
