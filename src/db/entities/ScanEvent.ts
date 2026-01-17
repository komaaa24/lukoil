import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';
import { ProductToken } from './ProductToken';
import { enumColumnType, timestampType } from '../utils';

export enum ScanSource {
  DEEPLINK = 'DEEPLINK',
  MANUAL = 'MANUAL',
}

@Entity({ name: 'scan_events' })
export class ScanEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.scans, { nullable: false })
  user!: User;

  @ManyToOne(() => ProductToken, (token) => token.scans, { nullable: true })
  productToken!: ProductToken | null;

  @Column({ type: 'varchar', length: 128 })
  tokenRaw!: string;

  @Index()
  @Column({ type: timestampType })
  scannedAt!: Date;

  @Column({ type: enumColumnType as any, enum: ScanSource, default: ScanSource.DEEPLINK })
  source!: ScanSource;
}
