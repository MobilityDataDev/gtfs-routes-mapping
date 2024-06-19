import { Pool } from 'pg';

export const getDatabasePool = (): Pool => {
  const {
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_USER,
    POSTGRES_DB,
    POSTGRES_PASSWORD
  } = process.env;

  return new Pool({
    host: POSTGRES_HOST,
    // @ts-ignore
    port: parseInt(POSTGRES_PORT, 10),
    database: POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD
  });
};
