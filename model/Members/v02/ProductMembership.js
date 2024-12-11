import { DataTypes, Sequelize } from "sequelize";
import db from "../../../config/dbConfig.js";

const ProductMembership = db.define(
  "membership_product",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vehicle_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    card_activation_fee: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Fee: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    KID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Create_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Update_by: {
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
    tableName: "membership_product",
    timestamps: false,
  }
);

export default ProductMembership;
