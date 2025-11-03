import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/core/user/entities/user.entity';
import { Entity, Column, Index, JoinColumn, OneToOne } from 'typeorm';

@Entity('black_list')
export class BlackList extends BaseEntity {
  @ApiProperty({
    description: 'The ID of the blacklisted user.',
    example: 1,
  })
  @Column({ unique: true })
  @Index()
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
