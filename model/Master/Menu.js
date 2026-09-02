import { DataTypes } from "sequelize";
import { db } from "../../config/dbConfig.js";

export const menuCMS = db.define(
    "menuCMS",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrementIdentity: true,
            allowNull: false,
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
            allowNull: true,
        },
        parent_slug: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        updatedBy: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "menuCMS",
        timestamps: false,
    }
);
