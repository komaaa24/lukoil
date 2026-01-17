import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../src/db/entities/User';
import { ProductToken } from '../src/db/entities/ProductToken';
import { ScanEvent } from '../src/db/entities/ScanEvent';
import { Subscription } from '../src/db/entities/Subscription';
import { Admin } from '../src/db/entities/Admin';
import { Broadcast } from '../src/db/entities/Broadcast';
import { BroadcastLog } from '../src/db/entities/BroadcastLog';
import { Referral } from '../src/db/entities/Referral';
import { PromoCode } from '../src/db/entities/PromoCode';
import { Complaint } from '../src/db/entities/Complaint';
import { ServiceCenter } from '../src/db/entities/ServiceCenter';

export const createTestDataSource = async () => {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    synchronize: true,
    logging: false,
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
  });
  await dataSource.initialize();
  return dataSource;
};
