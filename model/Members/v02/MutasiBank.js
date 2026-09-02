import { DataTypes, Sequelize } from "sequelize";
import { dbSecond } from "../../../config/dbConfig.js";

const MutasiBank = dbSecond.define(
  "membership_mutation_bank",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    locationName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transactionNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trxDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    noVirtualAcount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rfid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    platNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    typePurchase: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM,
      values: ["UNMATCHED", "MATCHED"],
      allowNull: true,
    },
    transferDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: true,
    },
    uploadedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    uniqueKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "membership_mutation_bank",
    timestamps: false,
  }
);

export default MutasiBank;
