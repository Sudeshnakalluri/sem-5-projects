const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Category = sequelize.define(
  "Category",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(60), allowNull: false },
    type: { type: DataTypes.ENUM("income", "expense"), allowNull: false },
    color: { type: DataTypes.STRING(10), defaultValue: "#4C6FFF" },
    icon: { type: DataTypes.STRING(30), defaultValue: "tag" },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "categories",
    indexes: [{ unique: true, fields: ["user_id", "name", "type"] }],
  }
);

module.exports = Category;
