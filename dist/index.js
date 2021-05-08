"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const constants_1 = require("./constants");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const deck_1 = require("./resolvers/deck");
const user_1 = require("./resolvers/user");
const redis_1 = __importDefault(require("redis"));
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const Deck_1 = require("./entities/Deck");
const Card_1 = require("./entities/Card");
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const card_1 = require("./resolvers/card");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield typeorm_1.createConnection(constants_1.__prod__
        ? {
            type: "postgres",
            url: process.env.DATABASE_URL,
            entities: [User_1.User, Deck_1.Deck, Card_1.Card],
            synchronize: true,
            migrations: [path_1.default.join(__dirname, "./migrations/*")],
            logging: true,
            extra: {
                ssl: true,
            },
        }
        : {
            type: "postgres",
            host: "localhost",
            port: 5050,
            username: "postgres",
            password: "1234",
            database: "LearnCards",
            entities: [User_1.User, Deck_1.Deck, Card_1.Card],
            synchronize: true,
            migrations: [path_1.default.join(__dirname, "./migrations/*")],
            logging: true,
        });
    conn.runMigrations();
    const app = express_1.default();
    const RedisStore = connect_redis_1.default(express_session_1.default);
    const redisClient = redis_1.default.createClient(constants_1.__prod__ ? process.env.REDIS_URL : "");
    app.use(cors_1.default({
        origin: constants_1.__prod__
            ? ["https://learncardsv2-client.herokuapp.com/"]
            : ["http://localhost:3000", "http://localhost:19006"],
        credentials: true,
    }));
    app.use(express_session_1.default({
        name: "qid",
        store: new RedisStore({
            client: redisClient,
            disableTouch: true,
        }),
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            sameSite: "lax",
            secure: constants_1.__prod__,
        },
        saveUninitialized: false,
        secret: "ifuherge",
        resave: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        playground: true,
        schema: yield type_graphql_1.buildSchema({
            resolvers: [deck_1.DeckResolver, user_1.UserResolver, card_1.CardResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
        }),
    });
    apolloServer.applyMiddleware({ app, cors: false });
    app.listen(4000, () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("app running at 4000");
    }));
});
main().catch((err) => {
    console.error(err);
});
//# sourceMappingURL=index.js.map