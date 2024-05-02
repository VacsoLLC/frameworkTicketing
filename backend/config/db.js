export const sqlite = {
  core: {
    client: 'sqlite3',
    connection: {
      filename: `./core.sqlite`,
    },
    useNullAsDefault: true,
  },
  ticketing: {
    client: 'sqlite3',
    connection: {
      filename: `./core.sqlite`,
    },
    useNullAsDefault: true,
  },
};

export const mysql = {
  core: {
    client: 'mysql2',
    connection: {
      host: 'localhost',
      user: 'framework',
      password: 'changeme',
      database: 'core',
    },
  },
};

// Postgres is not yet supported by the framework
export const pg = {
  core: {
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'framework',
      password: 'changeme',
      database: 'core',
    },
  },
};

export default sqlite;
