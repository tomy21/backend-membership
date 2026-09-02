import { DataTypes, Sequelize } from "sequelize";
import { db } from "../../../config/dbConfig.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { MemberUserRole } from "../../Master/RoleModel.js";
import LocationArea from "./LocationMaster.js";

const UserCMS = db.define(
  "membershipUsersCms",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    active_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expired_active: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_password_expired: {
      type: DataTypes.DATE,
      allowNull: true,
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
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "membershipUsersCms",
    timestamps: true,
    paranoid: true,
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

UserCMS.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

UserCMS.prototype.createActivationToken = function () {
  const activationToken = crypto.randomBytes(32).toString("hex");
  this.active_token = crypto
    .createHash("sha256")
    .update(activationToken)
    .digest("hex");
  this.expired_active = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return activationToken;
};

UserCMS.prototype.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

UserCMS.belongsTo(MemberUserRole, { foreignKey: "role" });


export default UserCMS;
