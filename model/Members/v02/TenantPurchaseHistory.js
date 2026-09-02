import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";
import User from "../Users.js";
import MemberTenant from "../MemberTenants.js";

const TennantPurchaseHistory = db.define(
  "tennant_purchase_history",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
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
    trx_id: {
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
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin_fee: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total_admin_fee: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total_price: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    additonal_fee: {
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
    status_payment: {
      type: DataTypes.ENUM,
      values: ["COMPLETED", "PENDING", "FAILED"],
      allowNull: false,
    },
    status_progress: {
      type: DataTypes.ENUM,
      values: ["COMPLETED", "PROCESSING", "INITIATED"],
      allowNull: false,
    },
    type_payment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purchase_type: {
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
    tableName: "tennant_purchase_history",
    timestamps: false,
  }
);

TennantPurchaseHistory.belongsTo(MemberTenant, {
  foreignKey: "user_id",
  targetKey: "id",
  as: "trxHistoryUserTennant",
});

export default TennantPurchaseHistory;
