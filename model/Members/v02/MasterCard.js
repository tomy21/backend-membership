import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";
import User from "../../Members/Users.js";
import LocationArea from "./LocationMaster.js";

const MasterCard = db.define(
  "master_card",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    no_card: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_used: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tennant_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tennant_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    card_type: {
      type: DataTypes.ENUM,
      values: ["PERSONAL", "TENNANT", "COMPLIMENT", "NOT_USED"],
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    location_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_name: {
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
    tableName: "master_card",
    timestamps: false,
  }
);

export default MasterCard;
