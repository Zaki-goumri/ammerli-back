import { EntityRepository } from '@mikro-orm/postgresql';
import { Address } from '../entities/address.entity';
import { CreateAddressDto } from '../dtos/create-address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';

export class AddressRepository extends EntityRepository<Address> {
  async createAddress(addressData: CreateAddressDto): Promise<Address> {
    const address = this.create(addressData);
    await this.em.persistAndFlush(address);
    return address;
  }

  async updateAddress(addressData: UpdateAddressDto, userId: number) {
    //   const address = await this.em.findOne(Address, { userId });
    //   wrap(address).assign(addressData);
    //   await this.em.flush();
    //   return address;
  }
}
