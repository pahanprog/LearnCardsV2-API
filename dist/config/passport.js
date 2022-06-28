"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const passport_1 = __importDefault(require("passport"));
const User_1 = require("../entities/User");
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const localStrategy = require("passport-local");
const argon2_1 = __importDefault(require("argon2"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
passport_1.default.serializeUser((req, user, done) => {
    req;
    if (user)
        done(null, user);
});
passport_1.default.deserializeUser(({ id }, done) => {
    User_1.User.findOne(id).then((user) => {
        done(undefined, { id: user === null || user === void 0 ? void 0 : user.id });
    });
});
passport_1.default.use(new localStrategy({
    usernameField: "usernameOrEmail",
}, (usernameOrEmail, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.User.findOne(usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } });
    if (!user) {
        return done(null, false, {
            message: [
                {
                    field: "usernameOrEmail",
                    message: "Пользователь с этими данными не существует",
                },
            ],
        });
    }
    const valid = yield argon2_1.default.verify(user.password, password);
    if (!valid) {
        return done(null, false, {
            message: [
                {
                    field: "password",
                    message: "Неправильный пароль",
                },
            ],
        });
    }
    return done(null, user);
})));
passport_1.default.use(new JWTstrategy({
    secretOrKey: process.env.JWT_SECRET,
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
}, (jwt, done) => __awaiter(void 0, void 0, void 0, function* () {
    return done(null, jwt.id);
})));
//# sourceMappingURL=passport.js.map