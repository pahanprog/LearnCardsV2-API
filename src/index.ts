import "reflect-metadata";
import { __prod__ } from "./constants";
import path from "path";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { DeckResolver } from "./resolvers/deck";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { Deck } from "./entities/Deck";
import { Card } from "./entities/Card";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import { CardResolver } from "./resolvers/card";

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
  const redisClient = redis.createClient(
    __prod__ ? process.env.REDIS_URL! : ""
  );

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

  app.set("trust proxy", true);

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        sameSite: "lax",
        secure: __prod__,
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
    context: ({ req, res }) => ({
      req,
      res,
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(__prod__ ? process.env.PORT : 4000, async () => {
    console.log("app running at 4000");
  });
};

main().catch((err) => {
  console.error(err);
});
