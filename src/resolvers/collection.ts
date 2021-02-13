import { Collection } from "../entities/Collection";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import {getConnection} from "typeorm"
import { MyContext } from "src/types";

@Resolver()
export class CollectionResolver {
    @Query(()=> [Collection])
    
    async collections(): Promise<Collection[]> {
        return getConnection().manager.find(Collection, {relations: ["questions"]});
    }

    @Query(()=> Collection, {nullable: true})
    
    collection(
        @Arg("id") id: number,
    ): Promise<Collection | undefined> {
        return getConnection().manager.findOne(Collection, {relations: ["questions"], where: {id: id}})
    }

    @Mutation(()=> Collection)
    
    async  createCollection(
        @Arg("title") title: string,
        @Arg("description") description: string,
    ): Promise<Collection> {
        const collecion =  new Collection();
        collecion.title = title;
        collecion.description = description;
        await getConnection().manager.save(collecion);
        return collecion;
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