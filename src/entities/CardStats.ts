import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Deck } from "./Deck";
import { Card } from "./Card";
import { User } from "./User";

@ObjectType()
@Entity()
export class CardStats extends BaseEntity {
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
  @Column({ default: 0.3, type: "float" })
  difficulty: number;

  @Field()
  @Column({ type: "float" })
  daysBetweenReviews: number;

  @Field()
  @Column({})
  dateLastReviewed: Date;

  @Field()
  @Column({ type: "float" })
  lastPerformanceRating: number;

  //relations
  @ManyToOne(() => Card, (card) => card.stats, { onDelete: "CASCADE" })
  card: Card;

  @ManyToOne(() => User, (user) => user.stats)
  user: User;
}
