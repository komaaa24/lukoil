import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admin } from './Admin';
import { BroadcastLog } from './BroadcastLog';
import { enumColumnType, timestampType } from '../utils';

export enum BroadcastTarget {
  ALL_USERS = 'ALL_USERS',
  USERS_WITH_PHONE = 'USERS_WITH_PHONE',
  USERS_WITH_ACTIVE_SUBS = 'USERS_WITH_ACTIVE_SUBS',
  SCANNED_LAST_30_DAYS = 'SCANNED_LAST_30_DAYS',
  BY_OIL_TYPE = 'BY_OIL_TYPE',
}

export enum BroadcastStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

@Entity({ name: 'broadcasts' })
export class Broadcast {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Admin, { nullable: false })
  createdByAdmin!: Admin;

  @Column({ type: 'text' })
  messageText!: string;

  @Column({ type: enumColumnType as any, enum: BroadcastTarget, default: BroadcastTarget.ALL_USERS })
  target!: BroadcastTarget;

  @Column({ type: enumColumnType as any, enum: BroadcastStatus, default: BroadcastStatus.DRAFT })
  status!: BroadcastStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  filterValue!: string | null;

  @Column({ type: timestampType, nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  sentCount!: number;

  @Column({ type: 'int', default: 0 })
  failCount!: number;

  @CreateDateColumn({ type: timestampType })
  createdAt!: Date;

  @UpdateDateColumn({ type: timestampType })
  updatedAt!: Date;

  @OneToMany(() => BroadcastLog, (log) => log.broadcast)
  logs!: BroadcastLog[];
}
