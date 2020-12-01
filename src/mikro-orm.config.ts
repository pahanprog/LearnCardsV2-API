import { Collection } from "./entities/Collection";
import { __prod__ } from "./constants";
import { MikroORM } from "@mikro-orm/core"
import path from 'path';
import { User } from "./entities/User";

export default {
    migrations: {
        path: path.join(__dirname,'./migrations'),
        pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    entities:  [Collection, User],
    dbName: "LearnCards",
    password:"1234",
    debug: !__prod__,
    type: "postgresql",
    port: 5050,
} as Parameters<typeof MikroORM.init>[0];