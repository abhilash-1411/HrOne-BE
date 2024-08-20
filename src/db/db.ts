import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'dummy',
  password: '1234',
  port: 5433,
});

export default pool;
