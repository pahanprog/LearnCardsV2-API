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

  @OneToMany(() => Deck, (deck) => deck.creator)
  decks: Deck[];

  @ManyToMany(() => Deck, (deck) => deck.learners)
  learning: Deck[];

  @Field()
  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;
}
