import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { OsType } from '../enums/os-type.enum';

/**
 * @fileoverview Defines the Token entity for storing user device tokens.
 * @module core/authentication/entities/token
 */

@Entity('tokens')
export class Token extends BaseEntity {
  @ApiProperty({
    description: 'The FCM or device token.',
    example: 'bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P1...',
  })
  @Column({ unique: true })
  fcmToken: string;

  @ApiProperty({
    description: 'The ID of the user associated with the token.',
    example: 1,
  })
  @Column()
  userId: number;

  @ApiProperty({
    description: 'The operating system of the device.',
    enum: OsType,
    example: OsType.ANDROID,
  })
  @Column({ type: 'enum', enum: OsType })
  os: OsType;

  @ManyToOne(() => User, (user) => user.tokens)
  user: User;
}
