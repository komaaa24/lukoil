import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { User } from './entities/User';
import { ProductToken } from './entities/ProductToken';
import { ScanEvent } from './entities/ScanEvent';
import { Subscription } from './entities/Subscription';
import { Admin } from './entities/Admin';
import { Broadcast } from './entities/Broadcast';
import { BroadcastLog } from './entities/BroadcastLog';
import { Referral } from './entities/Referral';
import { PromoCode } from './entities/PromoCode';
import { Complaint } from './entities/Complaint';
import { ServiceCenter } from './entities/ServiceCenter';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  host: env.DATABASE_URL ? undefined : env.DB_HOST,
  port: env.DATABASE_URL ? undefined : env.DB_PORT,
  username: env.DATABASE_URL ? undefined : env.DB_USERNAME,
  password: env.DATABASE_URL ? undefined : env.DB_PASSWORD,
  database: env.DATABASE_URL ? undefined : env.DB_NAME,
  synchronize: false,
  logging: env.NODE_ENV === 'development',
  entities: [
    User,
    ProductToken,
    ScanEvent,
    Subscription,
    Admin,
    Broadcast,
    BroadcastLog,
    Referral,
    PromoCode,
    Complaint,
    ServiceCenter,
  ],
  migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
  migrationsTableName: 'migrations',
});

export const initDataSource = async (): Promise<DataSource> => {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }
  try {
    await AppDataSource.initialize();
    logger.info('Database initialized');
    return AppDataSource;
  } catch (err) {
    logger.error({ err }, 'Failed to initialize database');
    throw err;
  }
};
