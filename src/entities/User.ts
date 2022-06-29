import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Deck } from "./Deck";
import { CardStats } from "./CardStats";
import { Session } from "./Session";

@ObjectType()
class UserDeckStats {
  @Field()
  unique: number;
  @Field()
  overall: number;
  @Field()
  percent: number;
}

@ObjectType()
@Entity()
export class User extends BaseEntity {
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
  @Column({ unique: true })
  username!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  //relations

  @OneToMany(() => Deck, (deck) => deck.creator)
  decks: Deck[];

  @ManyToMany(() => Deck, (deck) => deck.learners)
  learning: Deck[];

  @OneToMany(() => CardStats, (cardStats) => cardStats.user)
  stats: CardStats[];

  @ManyToMany(() => Session, (session) => session.user)
  @JoinTable()
  sessions: Session[];

  @Field(() => UserDeckStats)
  deckStats: {
    unique: number;
    overall: number;
    percent: number;
  };
}
