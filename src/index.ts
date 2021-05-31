import "reflect-metadata";
import { __prod__ } from "./constants";
import path from "path";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { DeckResolver } from "./resolvers/deck";
import { UserResolver } from "./resolvers/user";
import Redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { Deck } from "./entities/Deck";
import { Card } from "./entities/Card";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import { CardResolver } from "./resolvers/card";
import { MyContext } from "./types";
require("dotenv").config();

const main = async () => {
  const conn = await createConnection(
    __prod__
      ? {
          type: "postgres",
          url: process.env.DATABASE_URL!,
          entities: [User, Deck, Card],
          synchronize: true,
          migrations: [path.join(__dirname, "./migrations/*")],
          logging: true,
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        }
      : {
          type: "postgres",
          host: "localhost",
          port: 5050,
          username: "postgres",
          password: "1234",
          database: "LearnCards",
          entities: [User, Deck, Card],
          synchronize: true,
          migrations: [path.join(__dirname, "./migrations/*")],
          logging: true,
        }
  );

  conn.runMigrations();

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = Redis.createClient(__prod__ ? process.env.REDIS_URL! : "");
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:19006",
        "https://learncardsv2-client.herokuapp.com",
      ],
      credentials: true,
    })
  );

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, //1 day
        httpOnly: true,
        sameSite: "none",
        secure: __prod__,
        domain: __prod__ ? ".herokuapp.com" : undefined,
      },
      saveUninitialized: false,
      secret: "ifuherge",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    introspection: true,
    playground: true,
    schema: await buildSchema({
      resolvers: [DeckResolver, UserResolver, CardResolver],
      validate: false,
    }),
    context: ({ req, res }: MyContext) => {
      return {
        req,
        res,
        redis,
      };
    },
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(__prod__ ? process.env.PORT : 4000, async () => {
    console.log("app running at 4000");
  });
};

main().catch((err) => {
  console.error(err);
});
