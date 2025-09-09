import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";
import User from "../Users.js";

const PaymentTransaction = db.define(
  "payment_transactions",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    trx_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    inquiry_request_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    external_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expired_date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    virtual_account_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    virtual_account_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    virtual_account_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_using: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    module_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status_transaction: {
      type: DataTypes.ENUM,
      values: ["PENDING", "COMPLETED", "FAILED"],
      allowNull: false,
    },
    paid_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    app_module: {
      type: DataTypes.ENUM,
      values: [
        "APP_MEMBERSHIP",
        "APP_MEMBERSHIP_B2B",
        "APP_VOUCHER",
        "APP_OTHERS",
      ],
      allowNull: false,
    },
    RRN: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    no_tiket: {
      type: DataTypes.STRING,
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
    tableName: "payment_transactions",
    timestamps: false,
  }
);

export default PaymentTransaction;
