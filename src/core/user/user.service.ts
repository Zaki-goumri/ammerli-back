import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  static CACHE_KEY_PREFIX = 'user';

  static getCacheKey(key: string): string {
    return `${this.CACHE_KEY_PREFIX}:${key}`;
  }

  createUser(data: any): Promise<User> {
    throw new Error('Method not implemented.');
  }
  findByPhone(phone: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }
  findById(id: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }

  updateUser(user: User): Promise<User> {
    throw new Error('Method not implemented.');
  }
}
