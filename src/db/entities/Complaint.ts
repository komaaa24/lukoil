import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Admin } from './Admin';
import { enumColumnType, timestampType } from '../utils';

export enum ComplaintReason {
  UNKNOWN_TOKEN = 'UNKNOWN_TOKEN',
  DUPLICATE = 'DUPLICATE',
  DAMAGED = 'DAMAGED',
  OTHER = 'OTHER',
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

@Entity({ name: 'complaints' })
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.complaints, { nullable: false })
  user!: User;

  @Column({ type: 'varchar', length: 128 })
  tokenRaw!: string;

  @Column({ type: enumColumnType as any, enum: ComplaintReason })
  reason!: ComplaintReason;

  @Column({ type: 'text', nullable: true })
  text!: string | null;

  @Column({ type: enumColumnType as any, enum: ComplaintStatus, default: ComplaintStatus.OPEN })
  status!: ComplaintStatus;

  @CreateDateColumn({ type: timestampType })
  createdAt!: Date;

  @UpdateDateColumn({ type: timestampType })
  updatedAt!: Date;

  @Column({ type: timestampType, nullable: true })
  resolvedAt!: Date | null;

  @ManyToOne(() => Admin, { nullable: true })
  resolvedByAdmin!: Admin | null;
}
