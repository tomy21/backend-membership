import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";

const ProviderPayment = db.define(
  "payment_service_data",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    partner_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code_bank: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bank_id: {
      type: DataTypes.STRING,
      allowNull: false,
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
      allowNull: false,
    },
    client_secret: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    secret_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    merchant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    store_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sub_merchant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_show: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: "payment_service_data",
    timestamps: false,
  }
);

export default ProviderPayment;
