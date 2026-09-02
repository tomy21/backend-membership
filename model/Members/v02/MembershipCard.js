import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";

const MembershipCard = db.define(
  "membership_cards",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    customerNo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    CardStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    RFID_Data: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vehicleType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    locationCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expired: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: "membership_cards",
    timestamps: false,
  }
);

export default MembershipCard;
