import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";

const MasterLocationPrice = db.define(
  "MasterLocationPrices",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    namaProduk: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priceMotor: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    priceMobil: {
      type: DataTypes.DECIMAL,
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
    tableName: "MasterLocationPrices",
    timestamps: false,
  }
);

export default MasterLocationPrice;
