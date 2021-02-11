import { Entity, OneToMany, PrimaryKey, Property} from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";
import { Question } from "./Question";

@ObjectType()
@Entity()
export class Collection {

  @Field(()=>Int)
  @PrimaryKey()
  id!: number;

  @OneToMany(()=>Question, question => question.parent)
  questions: Question[];

  @Field(() => String)
  @Property({type: 'date'})
  createdAt = new Date();

  @Field(() => String)
  @Property({type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field()
  @Property({type: 'text'})
  title!: string;

  @Field()
  @Property({type: 'text'})
  description!: string;

}