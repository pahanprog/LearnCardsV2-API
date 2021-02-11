import { Entity, ManyToOne, PrimaryKey, Property} from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";
import {Collection} from "./Collection"

@ObjectType()
@Entity()
export class Question {

  @Field(()=>Int)
  @PrimaryKey()
  id!: number;

  @Field()
  @ManyToOne()
  parent: Collection;

  @Field()
  @Property({type: 'text'})
  question!: string;

  @Field()
  @Property({type: 'text'})
  answer!: string;

}