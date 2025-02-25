import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import db from "../../config/dbConfig.js";
<<<<<<< HEAD
import UserDetails from "./UserDetails.js";
import MemberUserProduct from "./MemberUserProduct.js";
import MemberUserRole from "./MemberUserRoles.js";
import MembershipCard from "./v02/MembershipCard.js";
=======
import MembershipCard from "./v02/MembershipCard.js";
import VehicleList from "./v02/VehicleList.js";
>>>>>>> production_v2

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
<<<<<<< HEAD
      allowNull: false,
=======
      allowNull: true,
>>>>>>> production_v2
      defaultValue: 0,
    },
    expired_active: {
      type: DataTypes.DATE,
<<<<<<< HEAD
      allowNull: false,
=======
      allowNull: true,
>>>>>>> production_v2
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_password_expired: {
      type: DataTypes.DATE,
      allowNull: true,
    },
<<<<<<< HEAD
=======
    is_active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
>>>>>>> production_v2
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

User.beforeCreate(async (user) => {
<<<<<<< HEAD
  user.PasswordHash = await bcrypt.hash(user.password, 10);
=======
  user.password = await bcrypt.hash(user.password, 10);
  user.pin = await bcrypt.hash(user.pin, 10);
>>>>>>> production_v2
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

<<<<<<< HEAD
UserDetails.prototype.correctPassword = async function (candidatePin, userPin) {
  return await bcrypt.compare(candidatePin, userPin);
};

User.hasMany(MembershipCard, {
  foreignKey: "customerNo", // Sesuaikan dengan kolom di tabel MembershipCard
  sourceKey: "customer_no", // Kolom yang cocok di tabel User
});

MembershipCard.belongsTo(User, {
  foreignKey: "customerNo", // Sesuaikan dengan kolom di tabel MembershipCard
=======
User.prototype.correctPin = async function (candidatePin, pin) {
  return await bcrypt.compare(candidatePin, pin);
};

User.hasMany(VehicleList, {
  foreignKey: "member_customer_no", // Sesuaikan dengan kolom di tabel MembershipCard
  sourceKey: "customer_no", // Kolom yang cocok di tabel User
});

VehicleList.belongsTo(User, {
  foreignKey: "member_customer_no", // Sesuaikan dengan kolom di tabel MembershipCard
>>>>>>> production_v2
  targetKey: "customer_no", // Kolom yang cocok di tabel User
});

// User.hasMany(UserDetails, {
//   foreignKey: "MemberUserId",
// });
// User.hasMany(MemberUserProduct, {
//   foreignKey: "MemberUserId",
// });
// User.hasMany(MemberUserRole, {
//   foreignKey: "UserId",
// });

// UserDetails.belongsTo(User, {
//   foreignKey: "MemberUserId",
// });
// MemberUserProduct.belongsTo(User, {
//   foreignKey: "MemberUserId",
// });

// MemberUserRole.belongsTo(User, {
//   foreignKey: "UserId",
// });

export default User;
