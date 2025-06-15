import { DataTypes, Sequelize } from "sequelize";
import db from "../../../config/dbConfig.js";

const MembershipNotification = db.define(
  "Membership_notification",
  {
    Id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    IsRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    PlateNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    CustomerNo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    NoRFID: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: "Membership_notification",
    timestamps: false,
  }
);

export default MembershipNotification;
