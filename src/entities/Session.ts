import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Deck } from "./Deck";
import { Card } from "./Card";
import { User } from "./User";

@ObjectType()
@Entity()
export class Session extends BaseEntity {
  //main columns
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column({ default: 0 })
  finishedCards: number;

  //relations
  @Field(() => Deck)
  @ManyToMany(() => Deck, (deck) => deck.sessions, {
    onDelete: "CASCADE",
    cascade: true,
  })
  deck: Deck;

  @ManyToMany(() => User, (user) => user.sessions)
  user: User;

  @Field(() => [Card])
  @ManyToMany(() => Card, (card) => card.sessions, {
    onDelete: "CASCADE",
    cascade: true,
  })
  @JoinTable()
  cards: Card[];

  @Field()
  cardsNumber: number;
}
