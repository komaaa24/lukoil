import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Broadcast } from './Broadcast';
import { User } from './User';
import { enumColumnType, timestampType } from '../utils';

export enum BroadcastLogStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity({ name: 'broadcast_logs' })
export class BroadcastLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Broadcast, (broadcast) => broadcast.logs, { nullable: false })
  broadcast!: Broadcast;

  @ManyToOne(() => User, (user) => user.broadcastLogs, { nullable: false })
  user!: User;

  @Column({ type: enumColumnType as any, enum: BroadcastLogStatus })
  status!: BroadcastLogStatus;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: timestampType })
  createdAt!: Date;
}
