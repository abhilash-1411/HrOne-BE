import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dummy',
  password: '1234',
  port: 5433,
});

export default pool;
