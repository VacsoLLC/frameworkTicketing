export const mysql = {
  core: {
    client: "mysql2",
    connection: {
      host: process.env.MYSQL_HOST || "127.0.0.1",
      user: "framework",
      password: process.env.MYSQL_PASSWORD,
      database: "core",
    },
  },
};

export default mysql;
