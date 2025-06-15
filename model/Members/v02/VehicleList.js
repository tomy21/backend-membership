import { DataTypes, Sequelize } from "sequelize";
import db from "../../../config/dbConfig.js";
import MembershipDetail from "./MembershipDetail.js";

const VehicleList = db.define(
  "customer_membership",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vehicle_type: {
      type: DataTypes.ENUM,
      values: ["MOBIL", "MOTOR"],
      allowNull: false,
    },
    cust_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    member_customer_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rfid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plate_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plate_number_image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stnk_image: {
      type: DataTypes.INTEGER,
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
    tableName: "customer_membership",
    timestamps: false,
  }
);

VehicleList.belongsTo(MembershipDetail, {
  foreignKey: "member_customer_no",
  targetKey: "member_customer_no",
});

export default VehicleList;
