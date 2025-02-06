import { DataTypes, Sequelize } from "sequelize";
import db from "../../../config/dbConfig.js";
import User from "../../Members/Users.js";

const HistoryPost = db.define(
  "check_in_history",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plate_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status_member: {
      type: DataTypes.ENUM,
      values: ["MEMBER", "NON-MEMBER"],
      allowNull: false,
    },
    tariff: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    check_in_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gate_in_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    checkout_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gate_out_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    balance_before: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    balance_after: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    is_close: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_released: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "check_in_history",
    timestamps: false,
  }
);

HistoryPost.belongsTo(User, {
  foreignKey: "user_id",
  targetKey: "id",
  as: "userHistoryPost",
});

export default HistoryPost;
