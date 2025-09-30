import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../../config/dbConfig.js";
import MembershipCard from "./v02/MembershipCard.js";
import VehicleList from "./v02/VehicleList.js";

const User = db.define(
  "Member_Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    customer_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM,
      values: ["MALE", "FEMALE"],
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    pin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reward_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    active_token: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
    reset_pin_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_pin_expired: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    timestamps: false,
    tableName: "Member_Customer",
  }
);

User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  if (user.changed("pin")) {
    user.pin = await bcrypt.hash(user.pin, 10);
  }
});

User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
  user.pin = await bcrypt.hash(user.pin, 10);
});

User.prototype.createActivationToken = function () {
  const activationToken = crypto.randomBytes(32).toString("hex");
  this.active_token = crypto
    .createHash("sha256")
    .update(activationToken)
    .digest("hex");
  this.expired_active = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return activationToken;
};

User.prototype.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

User.prototype.correctPin = async function (candidatePin, pin) {
  return await bcrypt.compare(candidatePin, pin);
};

User.hasMany(VehicleList, {
  foreignKey: "cust_id", // Sesuaikan dengan kolom di tabel MembershipCard
  sourceKey: "id", // Kolom yang cocok di tabel User
});

VehicleList.belongsTo(User, {
  foreignKey: "cust_id", // Sesuaikan dengan kolom di tabel MembershipCard
  targetKey: "id", // Kolom yang cocok di tabel User
});

VehicleList.belongsTo(User, {
  foreignKey: "member_customer_no",
  targetKey: "customer_no", // Kolom yang cocok di tabel User
  as: "customer_memberships",
});

export default User;
