import { DataTypes, Sequelize } from "sequelize";
import db from "../../../config/dbConfig.js";
import User from "../Users.js";

const TransactionHistoryPayment = db.define(
  "transaction_customer_history",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    virtual_account: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trxId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expired_date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    periode: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    statusPayment: {
      type: DataTypes.ENUM,
      values: ["PAID", "PENDING", "FAILED"],
      allowNull: false,
    },
    transactionType: {
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
    location_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    invoice_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purchase_type: {
      type: DataTypes.ENUM,
      values: ["MEMBERSHIP", "TOPUP"],
      allowNull: false,
    },
    vehicle_type: {
      type: DataTypes.ENUM,
      values: ["MOBIL", "MOTOR"],
      allowNull: false,
    },
    rfid: {
      type: DataTypes.STRING,
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
    tableName: "transaction_customer_history",
    timestamps: false,
  }
);

TransactionHistoryPayment.belongsTo(User, {
  foreignKey: "user_id",
  targetKey: "id",
  as: "trxHistoryUser",
});

export default TransactionHistoryPayment;
