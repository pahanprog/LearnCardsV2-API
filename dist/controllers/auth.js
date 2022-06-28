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
exports.postLogin = exports.postRegister = void 0;
const User_1 = require("../entities/User");
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
require("../config/passport");
const postRegister = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("CALLED REGITER WITH ", req.body);
    const email = yield User_1.User.findOne({
        where: [{ email: req.body.email }],
    });
    const username = yield User_1.User.findOne({
        where: [{ username: req.body.username }],
    });
    if (email) {
        const errors = [{ field: "email", message: "Email уже зарегистрирован" }];
        if (username) {
            errors.push({ field: "username", message: "Логин уже зарегистрирован" });
        }
        res.send({
            errors,
        });
        return;
    }
    else if (username) {
        res.send({
            errors: [{ field: "username", message: "Логин уже зарегистрирован" }],
        });
        return;
    }
    const hashedPassword = yield argon2_1.default.hash(req.body.password);
    const user = User_1.User.create({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
    });
    const saved = yield user.save();
    if (saved) {
        req.logIn(user, { session: false }, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                next(err);
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET);
            res.json({ token, id: user.id });
        }));
    }
});
exports.postRegister = postRegister;
const postLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    passport_1.default.authenticate("local", (err, user, info) => {
        if (err) {
            next(err);
            return;
        }
        if (!user) {
            res.send(JSON.stringify({ errors: info.message }));
            return;
        }
        req.logIn(user, { session: false }, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                next(err);
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET);
            res.json({
                token,
                id: user.id,
            });
        }));
    })(req, res, next);
});
exports.postLogin = postLogin;
//# sourceMappingURL=auth.js.map