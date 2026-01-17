import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';
import { enumColumnType } from '../utils';

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

@Entity({ name: 'admins' })
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'bigint', unique: true })
  telegramId!: string;

  @Column({ type: enumColumnType as any, enum: AdminRole, default: AdminRole.ADMIN })
  role!: AdminRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
