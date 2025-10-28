import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTokenDto } from './dto/create-token.dto';
import { Token } from './entities/token.entity';

@Injectable()
export class FcmTokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepo: Repository<Token>,
  ) {}

  async registerToken(dto: CreateTokenDto): Promise<void> {
    const token = this.tokenRepo.create({
      fcmToken: dto.fcmToken,
      userId: dto.userId,
      os: dto.os,
    });
    await this.tokenRepo.save(token);
  }

  async getActiveTokensForUser(userId: number): Promise<string[]> {
    const tokens = await this.tokenRepo.find({ where: { userId } });
    if (!tokens || tokens.length === 0) {
      throw new BadRequestException('No active tokens found for the user');
    }
    return tokens.map((token) => token.fcmToken);
  }

  async revokeToken(token: string): Promise<void> {
    await this.tokenRepo.delete({ fcmToken: token });
  }
}
