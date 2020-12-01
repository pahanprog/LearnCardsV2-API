import { Collection } from "../entities/Collection";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { MyContext } from "src/types";

@Resolver()
export class CollectionResolver {
    @Query(()=> [Collection])
    
    collections(
        @Ctx() {em}: MyContext
    ): Promise<Collection[]> {
        return em.find(Collection,  {});
    }

    @Query(()=> Collection, {nullable: true})
    
    collection(
        @Arg("id") id: number,
        @Ctx() {em}: MyContext
    ): Promise<Collection | null> {
        return em.findOne(Collection,  {id});
    }

    @Mutation(()=> Collection)
    
    async  createCollection(
        @Arg("title") title: string,
        @Arg("description") description: string,
        @Ctx() {em}: MyContext
    ): Promise<Collection> {
        const collecion =  em.create(Collection, {title, description});
        await em.persistAndFlush(collecion);
        return collecion;
    }

    @Mutation(()=> Collection, {nullable: true})
    
    async  updateCollection(
        @Arg("id") id: number,
        @Arg("title") title: string,
        @Arg("description") description: string,
        @Ctx() {em}: MyContext
    ): Promise<Collection | null> {
        const collecion = await em.findOne(Collection, {id});
        if (!collecion) {
            return null;
        }
        if  (typeof title !== "undefined"){
            collecion.title =  title;
        }
        if (typeof description !== "undefined") {
            collecion.description=description;
        }
        await em.persistAndFlush(collecion);
        return collecion;
    }

    @Mutation(()=> Boolean)
    
    async  deleteCollection(
        @Arg("id") id: number,
        @Ctx() {em}: MyContext
    ): Promise<Boolean> {
        try {
        await em.nativeDelete(Collection, {id})
        } catch {
            return false;
        }
        return true;
    }
}