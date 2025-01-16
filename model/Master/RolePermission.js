import { DataTypes, Sequelize } from "sequelize";
import db from "../../config/dbConfig.js";
import { MemberUserRole } from "./RoleModel.js";
import { MenuModels } from "./MenuModels.js";

export const RolePermission = db.define(
  "membershipRolePermission",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    can_view: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    can_create: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    can_update: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    can_delete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    can_report: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    menu_slug: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "membershipRolePermission",
    timestamps: false,
  }
);

MemberUserRole.hasMany(RolePermission, {
  foreignKey: "role_id",
  targetKey: "id",
});

RolePermission.belongsTo(MemberUserRole, {
  foreignKey: "role_id",
  targetKey: "id",
});

MenuModels.hasMany(RolePermission, {
  foreignKey: "menu_slug",
  sourceKey: "slug",
  as: "permissions",
});

RolePermission.belongsTo(MenuModels, {
  foreignKey: "menu_slug",
  targetKey: "slug",
  as: "menu",
});
