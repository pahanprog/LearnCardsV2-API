import { Collection } from "../entities/Collection";
import { Arg, Ctx, Field, InputType, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import {getConnection} from "typeorm"
import { MyContext } from "../types";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";

@InputType()
class CollectionInput {
    @Field()
    title: string;

    @Field()
    description: string;
}


@Resolver()
export class CollectionResolver {
    @Query(()=> [Collection], {nullable: true})
    
    async collections(
        @Ctx() {req}: MyContext
    ): Promise<Collection[] | null> {
        if (!req.session!.userId) {
            return null;
        }
        return getConnection().manager.find(Collection, {relations: ["questions"]});
    }

    @Query(()=> Collection, {nullable: true})
    
    collection(
        @Arg("id") id: number,
    ): Promise<Collection | undefined> {
        return getConnection().manager.findOne(Collection, {relations: ["questions"], where: {id: id}})
    }

    @Mutation(()=> Collection)
    @UseMiddleware(isAuth)
    async  createCollection(
        @Arg("input") input: CollectionInput,
        @Ctx() {req}: MyContext
    ): Promise<Collection> {
        return Collection.create({
            ...input,
            creatorId: req.session!.userId
        }).save();
    }

    @Mutation(()=> Collection, {nullable: true})
    
    async  updateCollection(
        @Arg("id") id: number,
        @Arg("title", {nullable: true}) title: string,
        @Arg("description", {nullable: true}) description: string,
    ): Promise<Collection | null> {
        const collecion = await getConnection().manager.findOne(Collection, {relations: ["questions"], where: {id: id}});
        if (!collecion) {
            return null;
        }
        if  (typeof title !== "undefined"){
            collecion.title =  title;
        }
        if (typeof description !== "undefined") {
            collecion.description=description;
        }
        await getConnection().manager.save(collecion);
        return collecion;
    }

    @Mutation(()=> Boolean)
    
    async  deleteCollection(
        @Arg("id") id: number,
    ): Promise<Boolean> {
        try {
            const collection = await getConnection().manager.findOne(Collection, {where: {id: id}});
            await getConnection().manager.remove(collection)
        } catch (e) {
            return false;
        }
        return true;
    }
}