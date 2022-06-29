import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Deck } from "./Deck";
import { CardStats } from "./CardStats";
import { Session } from "./Session";

@ObjectType()
@Entity()
export class Card extends BaseEntity {
  //main columns
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column()
  order!: number;

  @Field()
  @Column({ type: "text" })
  question: string;

  @Field()
  @Column({ type: "text" })
  answer: string;

  //relations
  @ManyToOne(() => Deck, (deck) => deck.cards, {
    onDelete: "CASCADE",
  })
  deck: Deck;

  @Field(() => [CardStats])
  @OneToMany(() => CardStats, (cardStats) => cardStats.card, {
    cascade: true,
  })
  stats: CardStats[];

  @ManyToMany(() => Session, (session) => session.cards, {
    onDelete: "CASCADE",
  })
  sessions: Session[];
}
