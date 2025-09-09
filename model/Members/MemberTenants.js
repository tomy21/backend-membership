import { Sequelize, DataTypes } from "sequelize";
import { db } from "../../config/dbConfig.js";
import { LocationMembers } from "../Master/RefLocationMembers.js";

const MemberTenant = db.define(
  "admin_tennant",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tennant_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    tennant_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    active_token: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    expired_active: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reset_password_token: {
      type: DataTypes.STRING(225),
      allowNull: false,
    },
    reset_password_expired: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    customer_no: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    create_by: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    update_by: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "admin_tennant",
  }
);

export default MemberTenant;
