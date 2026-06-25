import { Sequelize } from "sequelize-typescript";
import config from "./config";
import { join } from "path";

const sequelize = new Sequelize({
  database: config.mysql.database,
  username: config.mysql.username,
  password: config.mysql.password,
  host: config.mysql.host,
  dialect: "mysql",
  port: config.mysql.port,
  timezone: "+00:00",
  logging: false,
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
  models: [join(__dirname, "../modules/**/*.model.{js,ts}")],
});

export { sequelize };
export default sequelize;
