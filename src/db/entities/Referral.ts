import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';
import { timestampType } from '../utils';

@Entity({ name: 'referrals' })
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.referralsMade, { nullable: false })
  inviter!: User;

  @ManyToOne(() => User, (user) => user.referralsReceived, { nullable: false })
  invited!: User;

  @CreateDateColumn({ type: timestampType })
  createdAt!: Date;
}
