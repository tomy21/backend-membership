import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../config/dbConfig.js";
import { RolePermission } from "./RolePermission.js";

export const MenuModels = db.define(
  "membershipMenuCMS",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modified_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "membershipMenuCMS",
    timestamps: false,
    paranoid: true,
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// MenuModels.hasMany(RolePermission, {
//   foreignKey: "menu_slug",
//   targetKey: "slug",
//   as: "permissions",
// });
// RolePermission.belongsTo(MenuModels, {
//   foreignKey: "menu_slug",
//   targetKey: "slug",
//   as: "menu",
// });

MenuModels.belongsTo(MenuModels, {
  foreignKey: "parent_slug",
  sourceKey: "slug",
  as: "parentMenu",
});
MenuModels.hasMany(MenuModels, {
  foreignKey: "parent_slug",
  sourceKey: "slug",
  as: "subMenus",
});
