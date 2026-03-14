import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'node:path';

// Try multiple .env locations: monorepo root (local dev) and api dir
config({ path: join(__dirname, '..', '..', '..', '.env') });
config({ path: join(__dirname, '..', '.env') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: requireEnv('DATABASE_HOST'),
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: requireEnv('DATABASE_USER'),
  password: requireEnv('DATABASE_PASSWORD'),
  database: requireEnv('DATABASE_NAME'),
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
});
