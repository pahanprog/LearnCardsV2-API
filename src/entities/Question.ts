import {BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm"
import { Field, ObjectType } from "type-graphql"
import { Collection } from "./Collection";
import { type } from "os";

@ObjectType()
@Entity()
export class Question extends BaseEntity {

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Collection, collection => collection.questions, {onDelete: "CASCADE"})
  parent: Collection;

  @Field()
  @Column({type: 'text'})
  question!: string;

  @Field()
  @Column({type: 'text'})
  answer!: string;
}