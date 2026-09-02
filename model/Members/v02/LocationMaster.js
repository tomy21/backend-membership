import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";

const LocationArea = db.define(
  "location_area",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    location_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    location_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    KID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    coordinate: {
      type: DataTypes.TEXT,
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
    tableName: "location_area",
    timestamps: false,
  }
);

export default LocationArea;
