import {BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm"
import { Field, ObjectType } from "type-graphql"
import { Collection } from "./Collection";

@ObjectType()
@Entity()
export class User extends BaseEntity {

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(()=>Collection, collection=>collection.creator)
  collections: Collection[];

  @Field()
  @Column({unique: true})
  username!: string;

  @Column()
  password!: string;
}