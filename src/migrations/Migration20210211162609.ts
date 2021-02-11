import { Migration } from '@mikro-orm/migrations';

export class Migration20210211162609 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "username" text not null, "password" text not null);');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');

    this.addSql('create table "collection" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null, "description" text not null);');

    this.addSql('create table "question" ("id" serial primary key, "parent_id" int4 not null, "question" text not null, "answer" text not null);');

    this.addSql('alter table "question" add constraint "question_parent_id_foreign" foreign key ("parent_id") references "collection" ("id") on update cascade;');
  }

}
