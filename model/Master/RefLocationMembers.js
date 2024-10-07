import { DataTypes } from "sequelize";
import db from "../../config/dbConfig.js";
import { Location } from "./RefLocation.js";

export const LocationMembers = db.define(
  "RefLocationMembers",
  {
    Id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    LocationId: {
      type: DataTypes.STRING(40),
      unique: true,
      references: {
        model: "RefLocation",
        key: "Id",
      },
    },
    LocationCode: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    LocationName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    IsMember: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    QuotaMobil: {
      type: DataTypes.INTEGER,
    },
    QuotaMotor: {
      type: DataTypes.INTEGER,
    },
    CreatedOn: {
      type: DataTypes.DATE,
      field: "CreatedOn",
      defaultValue: DataTypes.NOW,
    },
    CreatedBy: {
      type: DataTypes.STRING(50),
    },
    UpdatedOn: {
      type: DataTypes.DATE,
      field: "UpdatedOn",
      defaultValue: DataTypes.NOW,
    },
    UpdatedBy: {
      type: DataTypes.STRING(50),
    },
  },
  { timestamps: false, tableName: "RefLocationMembers" }
);

LocationMembers.belongsTo(Location, {
  foreignKey: "LocationId",
  as: "MemberLocation",
});
