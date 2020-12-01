import "reflect-metadata";
import {MikroORM} from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql"
import { CollectionResolver } from "./resolvers/collection";
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from 'cors'

const main = async ()  => {
    const orm =  await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();

    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(cors({
        origin: "http://localhost:3000",
        credentials: true
    }))

    app.use(session({
        name: 'qid',
        store: new RedisStore({
            client: redisClient,
            disableTouch: true,
        }),
        cookie: {
            httpOnly: true,
            maxAge: 1000 *  60  * 60 * 24 * 365 * 10,  //10 years
            sameSite:  'lax',
            secure: __prod__,
        },
        saveUninitialized: false,
        secret: "ifuherge",
        resave: false,
    }))

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [CollectionResolver,UserResolver],
            validate: false,
        }),
        context:  ({ req, res }):MyContext => ({em: orm.em, req, res}),
    });

    apolloServer.applyMiddleware({app, cors: false});

    app.listen(4000,()=>{
        console.log("server started on localhost:4000");
    })

    // const collection = orm.em.create(Collection, {title: "Second collection", description: "Well i dont really need a description for this one"});
    // await orm.em.persistAndFlush(collection);

}

main().catch((err)=>{
    console.error(err);
})