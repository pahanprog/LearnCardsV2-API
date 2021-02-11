"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Collection_1 = require("./entities/Collection");
const constants_1 = require("./constants");
const path_1 = __importDefault(require("path"));
const User_1 = require("./entities/User");
const Question_1 = require("./entities/Question");
exports.default = {
    migrations: {
        path: path_1.default.join(__dirname, './migrations'),
        pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    entities: [Collection_1.Collection, User_1.User, Question_1.Question],
    dbName: "LearnCards",
    password: "1234",
    debug: !constants_1.__prod__,
    type: "postgresql",
    port: 5050,
};
//# sourceMappingURL=mikro-orm.config.js.map