import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";

const PaymentLog = db.define(
  "payment_log",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    status_module: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    module_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    virtual_account_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    virtual_account_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    request_payload: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response_payload: {
      type: DataTypes.TEXT,
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
    endpoint: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: "payment_log",
    timestamps: false,
  }
);

export default PaymentLog;
