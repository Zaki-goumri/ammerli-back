import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum Language {
  AR = 'ar',
  FR = 'fr',
  EN = 'en',
}

@Entity('settings')
export class Settings extends BaseEntity {
  @ApiProperty({
    description: 'User preferred language',
    enum: Language,
    example: Language.EN,
  })
  @Column({
    type: 'enum',
    enum: Language,
    default: Language.AR,
  })
  language: Language;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;
}
