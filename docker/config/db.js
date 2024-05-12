export const mysql = {
  core: {
    client: "mysql2",
    connection: {
      host: "mariadb",
      user: "framework",
      password: process.env.MYSQL_PASSWORD,
      database: "core",
    },
  },
};

export default mysql;
