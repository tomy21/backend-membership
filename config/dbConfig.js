import dotenv from "dotenv";
import { Sequelize } from "sequelize";
dotenv.config({ path: ".env" });

export const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    timezone: "+07:00",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const dbSecond = new Sequelize(
  process.env.DB_NAME_DUMP,
  process.env.DB_USER_DUMP,
  process.env.DB_PASSWORD_DUMP,
  {
    host: process.env.DB_HOST_DUMP,
    dialect: "mysql",
    logging: false,
    timezone: "+07:00",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);
