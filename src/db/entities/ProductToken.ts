import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Subscription } from './Subscription';
import { ScanEvent } from './ScanEvent';
import { timestampType } from '../utils';

@Entity({ name: 'product_tokens' })
export class ProductToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 128, unique: true })
  token!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: timestampType })
  createdAt!: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.productToken)
  subscriptions!: Subscription[];

  @OneToMany(() => ScanEvent, (scan) => scan.productToken)
  scans!: ScanEvent[];
}
