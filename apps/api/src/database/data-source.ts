import { DataSource } from 'typeorm';
import * as path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const entitiesPath = isProduction
  ? path.join(__dirname, '**', '*.entity.js')
  : path.join(__dirname, '**', '*.entity.ts');
const migrationsPath = isProduction
  ? path.join(__dirname, 'migrations', '*.js')
  : path.join(__dirname, 'migrations', '*.ts');

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'aula_user',
  password: process.env.DATABASE_PASSWORD || 'aula_secret',
  database: process.env.DATABASE_NAME || 'aula_docente',
  entities: [entitiesPath],
  migrations: [migrationsPath],
  synchronize: false,
  logging: !isProduction,
});
