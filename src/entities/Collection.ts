import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm"
import { Field, ObjectType } from "type-graphql"
import { type } from "os";
import { Question } from "./Question";

@ObjectType()
@Entity()
export class Collection {

  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field(()=>[Question])
  @OneToMany(() => Question, question=>question.parent)
  questions: Question[];

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

