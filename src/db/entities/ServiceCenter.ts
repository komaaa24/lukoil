import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'service_centers' })
export class ServiceCenter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Index()
  @Column({ type: 'double precision' })
  lat!: number;

  @Index()
  @Column({ type: 'double precision' })
  lon!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
