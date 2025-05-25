import { DataTypes, Sequelize } from "sequelize";
import db from "../../../config/dbConfig.js";
import LocationArea from "./LocationMaster.js";

const MembershipDetail = db.define(
  "customer_membership_detail",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    Cust_Member: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    location_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_used: {
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
    invoice_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    member_customer_no: {
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
    tableName: "customer_membership_detail",
    timestamps: false,
  }
);

MembershipDetail.belongsTo(LocationArea, {
  foreignKey: "location_id",
  targetKey: "location_code",
});

export default MembershipDetail;
