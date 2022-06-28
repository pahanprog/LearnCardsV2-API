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
const passport_1 = __importDefault(require("passport"));
const auth_1 = __importDefault(require("./routes/auth"));
const CardStats_1 = require("./entities/CardStats");
const Session_1 = require("./entities/Session");
require("dotenv").config();
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, typeorm_1.createConnection)(constants_1.__prod__
        ? {
            type: "postgres",
            url: process.env.DATABASE_URL,
            entities: [User_1.User, Deck_1.Deck, Card_1.Card, CardStats_1.CardStats, Session_1.Session],
            synchronize: true,
            migrations: [path_1.default.join(__dirname, "./migrations/*")],
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
            entities: [User_1.User, Deck_1.Deck, Card_1.Card, CardStats_1.CardStats, Session_1.Session],
            synchronize: true,
            migrations: [path_1.default.join(__dirname, "./migrations/*")],
            logging: true,
        });
    conn.runMigrations();
    const app = (0, express_1.default)();
    const RedisStore = (0, connect_redis_1.default)(express_session_1.default);
    const redis = redis_1.default.createClient(constants_1.__prod__ ? process.env.REDIS_URL : "");
    app.set("trust proxy", 1);
    app.use((0, cors_1.default)({
        origin: [
            "http://localhost:3000",
            "http://localhost:19006",
            "https://learncardsv2-client.herokuapp.com",
        ],
        credentials: true,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        introspection: true,
        playground: true,
        schema: yield (0, type_graphql_1.buildSchema)({
            resolvers: [deck_1.DeckResolver, user_1.UserResolver, card_1.CardResolver],
            validate: false,
        }),
        context: ({ req, res }) => {
            return {
                req,
                res,
                redis,
            };
        },
    });
    app.use(express_1.default.json({ limit: "10mb" }));
    app.use(passport_1.default.initialize());
    app.post("/graphql", (req, res, next) => {
        passport_1.default.authenticate("jwt", { session: false }, (err, user, info) => {
            err;
            info;
            if (user) {
                req.user = user;
            }
            next();
        })(req, res, next);
    });
    app.use("/auth", auth_1.default);
    apolloServer.applyMiddleware({ app, cors: false });
    app.listen(constants_1.__prod__ ? process.env.PORT : 5000, () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("app running at 5000");
    }));
});
main().catch((err) => {
    console.error(err);
});
//# sourceMappingURL=index.js.map