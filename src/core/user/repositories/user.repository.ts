import { EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export class UserRepository extends EntityRepository<User> {
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.findOne({ phoneNumber }, { populate: ['address'] });
  }

  async findById(id: number): Promise<User | null> {
    return this.findOne({ id }, { populate: ['address'] });
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const user = this.create(userData);
    await this.em.persistAndFlush(user);
    return user;
  }

  async updateUser(user: UpdateUserDto, id: number) {
    return this.nativeUpdate({ id }, user);
  }

  async findByPhoneNumberWithAddress(
    phoneNumber: string,
  ): Promise<User | null> {
    return this.findOne({ phoneNumber }, { populate: ['address'] });
  }

  async deleteUser(id: number) {
    return this.nativeDelete({ id });
  }
}
