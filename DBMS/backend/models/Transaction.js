const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Transaction = sequelize.define(
  "Transaction",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.ENUM("income", "expense"), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    description: { type: DataTypes.STRING(200), defaultValue: "" },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    paymentMethod: {
      type: DataTypes.ENUM("cash", "card", "bank_transfer", "upi", "other"),
      defaultValue: "other",
    },
    isRecurring: { type: DataTypes.BOOLEAN, defaultValue: false },
    tags: { type: DataTypes.STRING(300), defaultValue: "" },
  },
  {
    tableName: "transactions",
    indexes: [
      { fields: ["user_id", "date"] },
      { fields: ["user_id", "type", "date"] },
    ],
  }
);

module.exports = Transaction;
