import {BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm"
import { Field, ObjectType } from "type-graphql"
import { type } from "os";
import { Question } from "./Question";
import { User } from "./User";

@ObjectType()
@Entity()
export class Collection extends BaseEntity {

  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field(()=>[Question])
  @OneToMany(() => Question, question=>question.parent)
  questions: Question[];

  @Field()
  @Column()
  creatorId: number;

  @ManyToOne(()=>User, user=>user.id)
  creator: User;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  description!: string;
  
  @Field(()=> String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(()=> String)
  @UpdateDateColumn()
  updatedAt: Date;


}

