import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Deck } from "./Deck";

@ObjectType()
@Entity()
export class Card extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  number!: number;

  @Field()
  @Column()
  parentId: number;

  @ManyToOne(() => Deck, (deck) => deck.cards, {
    onDelete: "CASCADE",
  })
  parent: Deck;

  @Field()
  @Column({ type: "text" })
  question!: string;

  @Field()
  @Column({ type: "text" })
  answer!: string;
}
