import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';
import { timestampType } from '../utils';
import { enumColumnType } from '../utils';

export enum PromoCodeStatus {
  ISSUED = 'ISSUED',
  USED = 'USED',
}

@Entity({ name: 'promo_codes' })
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @ManyToOne(() => User, (user) => user.promoCodes, { nullable: false })
  user!: User;

  @Column({ type: enumColumnType as any, enum: PromoCodeStatus, default: PromoCodeStatus.ISSUED })
  status!: PromoCodeStatus;

  @CreateDateColumn({ type: timestampType })
  issuedAt!: Date;

  @Column({ type: timestampType, nullable: true })
  usedAt!: Date | null;
}
