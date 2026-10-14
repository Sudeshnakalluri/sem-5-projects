const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Goal = sequelize.define(
  "Goal",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100), allowNull: false },
    targetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    savedAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    targetDate: { type: DataTypes.DATEONLY, allowNull: true },
    icon: { type: DataTypes.STRING(30), defaultValue: "target" },
    color: { type: DataTypes.STRING(10), defaultValue: "#2FBF9F" },
    status: {
      type: DataTypes.ENUM("active", "completed", "abandoned"),
      defaultValue: "active",
    },
  },
  { tableName: "goals" }
);

module.exports = Goal;
