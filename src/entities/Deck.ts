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
import { Card } from "./Card";
import { User } from "./User";
import { Session } from "./Session";

@ObjectType()
@Entity()
export class Deck extends BaseEntity {
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
  @Column()
  title!: string;

  @Field()
  @Column()
  description!: string;

  //relations
  @Field(() => [Card])
  @OneToMany(() => Card, (card) => card.deck)
  cards: Card[];

  @Field(() => [Session])
  @OneToMany(() => Session, (session) => session.deck)
  sessions: Session[];

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.id)
  creator: User;

  @Field(() => [User])
  @ManyToMany(() => User)
  @JoinTable()
  learners: User[];
}
