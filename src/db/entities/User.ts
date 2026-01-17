import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScanEvent } from './ScanEvent';
import { Subscription } from './Subscription';
import { BroadcastLog } from './BroadcastLog';
import { enumColumnType, timestampType } from '../utils';
import { Referral } from './Referral';
import { PromoCode } from './PromoCode';
import { Complaint } from './Complaint';

export enum MileageMode {
  MONTHLY = 'MONTHLY',
  KM = 'KM',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'bigint', unique: true })
  telegramId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phoneNumber!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  languageCode!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  vehicleBrand!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  oilType!: string | null;

  @Column({ type: enumColumnType as any, enum: MileageMode, default: MileageMode.MONTHLY })
  mileageMode!: MileageMode;

  @Column({ type: 'int', default: 0 })
  mileageCurrent!: number;

  @Column({ type: 'int', default: 5000 })
  mileageThreshold!: number;

  @Index()
  @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
  referralCode!: string | null;

  @Column({ type: 'int', default: 0 })
  points!: number;

  @CreateDateColumn({ type: timestampType })
  createdAt!: Date;

  @UpdateDateColumn({ type: timestampType })
  updatedAt!: Date;

  @OneToMany(() => ScanEvent, (scan) => scan.user)
  scans!: ScanEvent[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions!: Subscription[];

  @OneToMany(() => BroadcastLog, (log) => log.user)
  broadcastLogs!: BroadcastLog[];

  @OneToMany(() => Referral, (ref) => ref.inviter)
  referralsMade!: Referral[];

  @OneToMany(() => Referral, (ref) => ref.invited)
  referralsReceived!: Referral[];

  @OneToMany(() => PromoCode, (promo) => promo.user)
  promoCodes!: PromoCode[];

  @OneToMany(() => Complaint, (complaint) => complaint.user)
  complaints!: Complaint[];
}
