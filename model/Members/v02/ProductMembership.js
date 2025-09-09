import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";
import LocationArea from "./LocationMaster.js";

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
    periode: {
      type: DataTypes.ENUM,
      values: [
        "1 Bulan",
        "2 Bulan",
        "3 Bulan",
        "4 Bulan",
        "5 Bulan",
        "6 Bulan",
        "7 Bulan",
        "8 Bulan",
        "9 Bulan",
        "10 Bulan",
        "11 Bulan",
        "12 Bulan",
      ],
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

ProductMembership.belongsTo(LocationArea, {
  foreignKey: "location_code",
  targetKey: "location_code",
});

export default ProductMembership;
