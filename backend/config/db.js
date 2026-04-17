export const mariadb = {
  core: {
    client: "mysql2",
    connection: {
      host: process.env.MARIADB_HOST || "127.0.0.1",
      user: process.env.MARIADB_USER || "framework",
      password: process.env.MARIADB_PASSWORD,
      database: "core",
    },
  },
};

export default mariadb;
