import { DataTypes } from "sequelize";
import { db } from "../../config/dbConfig.js";

export const BankProvider = db.define(
  "payment_service_data",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    partner_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    code_bank: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bank_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type_payment: {
      type: DataTypes.ENUM,
      values: [
        "E_WALLET",
        "VIRTUAL_ACCOUNT",
        "QRIS",
        "PAYLATER",
        "CREDIT_CARD",
        "DEBIT_CARD",
        "POINT",
      ],
      allowNull: false,
    },
    gateway_partner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    client_secret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secret_key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    merchant_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    store_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sub_merchant_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_show: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    admin_fee: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "payment_service_data",
    timestamps: false,
  }
);
