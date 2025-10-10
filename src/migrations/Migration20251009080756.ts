import { Migration } from '@mikro-orm/migrations';

export class Migration20251009080756 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "address" ("id" serial primary key, "street" varchar(255) not null, "city" varchar(255) not null, "district" varchar(255) not null);`);

    this.addSql(`create table "user" ("id" serial primary key, "phone_number" varchar(255) not null, "name" varchar(255) not null, "location_url" varchar(255) null, "address_id" int null, "supermarket_name" varchar(255) not null, "profile_pic" varchar(255) not null, "role" text check ("role" in ('ADMIN', 'SUPERMARKET', 'WHOLESALER')) not null);`);
    this.addSql(`alter table "user" add constraint "user_address_id_unique" unique ("address_id");`);

    this.addSql(`alter table "user" add constraint "user_address_id_foreign" foreign key ("address_id") references "address" ("id") on update cascade on delete set null;`);
  }

}
