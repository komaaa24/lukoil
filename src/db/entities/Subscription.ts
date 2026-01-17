import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { ProductToken } from './ProductToken';
import { enumColumnType, timestampType } from '../utils';

export enum ReminderMode {
  MONTHLY = 'MONTHLY',
  KM = 'KM',
}

@Entity({ name: 'subscriptions' })
@Unique(['user', 'productToken'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.subscriptions, { nullable: false })
  user!: User;

  @ManyToOne(() => ProductToken, (token) => token.subscriptions, { nullable: false })
  productToken!: ProductToken;

  @Column({ type: 'int', default: 1 })
  reminderDayOfMonth!: number;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Tashkent' })
  timezone!: string;

  @Column({ type: enumColumnType as any, enum: ReminderMode, default: ReminderMode.MONTHLY })
  mode!: ReminderMode;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Index()
  @Column({ type: timestampType })
  nextRunAt!: Date;

  @Column({ type: timestampType, nullable: true })
  lastSentAt!: Date | null;

  @Column({ type: timestampType, nullable: true })
  lastConfirmedAt!: Date | null;

  @Column({ type: timestampType, nullable: true })
  snoozedUntil!: Date | null;

  @CreateDateColumn({ type: timestampType })
  createdAt!: Date;

  @UpdateDateColumn({ type: timestampType })
  updatedAt!: Date;
}
