import "reflect-metadata";
import { __prod__ } from "./constants";
import path from "path";
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql"
import { CollectionResolver } from "./resolvers/collection";
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import session from "express-session";
import connectRedis from "connect-redis";
import cors from 'cors'
import { Collection } from "./entities/Collection";
import { Question } from "./entities/Question";
import {createConnection} from "typeorm"
import { User } from "./entities/User";

const main = async ()  => {
    const conn = await createConnection({
        type: "postgres",
        host: "localhost",
        port: 5050,
        username: "postgres",
        password: "1234",
        database: "LearnCards",
        entities: [User, Collection, Question],
        synchronize: true,
        migrations: [path.join(__dirname, "./migrations/*")],
        logging: true
    })

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
        context: ({ req, res }) => ({
            req,
            res,
        }),
    });

    apolloServer.applyMiddleware({app, cors: false});

    app.listen(4000,async ()=>{
        console.log("app running at 4000")
    })
}

main().catch((err)=>{
    console.error(err);
})