import { Sequelize } from "sequelize-typescript";
import config from "./config";
import fs from "fs";
import path from "path";

const sequelize = new Sequelize({
  database: config.mysql.database,
  username: config.mysql.username,
  password: config.mysql.password,
  host: config.mysql.host,
  dialect: "mysql",
  port: config.mysql.port,
  logging: false,
  dialectOptions: {
    ssl: {
      ca: fs.readFileSync(path.resolve(config.mysql.ca)),
    },
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  models: [__dirname + "/../models/*.model.ts"],
});

export default sequelize;
