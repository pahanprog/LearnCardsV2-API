"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
exports.UserResolver = void 0;
const User_1 = require("../entities/User");
const type_graphql_1 = require("type-graphql");
const argon2_1 = __importDefault(require("argon2"));
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const constants_1 = require("../constants");
const util_1 = require("util");
const isAuth_1 = require("../middleware/isAuth");
const Deck_1 = require("../entities/Deck");
const CardStats_1 = require("../entities/CardStats");
let FieldError = class FieldError {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    (0, type_graphql_1.ObjectType)()
], FieldError);
let StatsResponse = class StatsResponse {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "overallCards", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "learnedCards", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "createdDecks", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "studentsInCreatedDecks", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "overallLearnedPercent", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "learnedPercent", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => [Deck_1.Deck]),
    __metadata("design:type", Array)
], StatsResponse.prototype, "createdDecksArray", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => [Deck_1.Deck]),
    __metadata("design:type", Array)
], StatsResponse.prototype, "learningDecksArray", void 0);
StatsResponse = __decorate([
    (0, type_graphql_1.ObjectType)()
], StatsResponse);
let UserResponse = class UserResponse {
};
__decorate([
    (0, type_graphql_1.Field)(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "errors", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => User_1.User, { nullable: true }),
    __metadata("design:type", User_1.User)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    (0, type_graphql_1.ObjectType)()
], UserResponse);
let ChangePasswordResponse = class ChangePasswordResponse {
};
__decorate([
    (0, type_graphql_1.Field)(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], ChangePasswordResponse.prototype, "errors", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => Boolean, { nullable: true }),
    __metadata("design:type", Boolean)
], ChangePasswordResponse.prototype, "changed", void 0);
ChangePasswordResponse = __decorate([
    (0, type_graphql_1.ObjectType)()
], ChangePasswordResponse);
let UserResolver = class UserResolver {
    me({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return null;
            }
            const user = yield User_1.User.findOne(req.user);
            return user;
        });
    }
    forgotPassword(email, { redis }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({ where: { email: email } });
            if (!user) {
                return true;
            }
            const token = (0, uuid_1.v4)();
            yield redis.set(constants_1.FORGOT_PASSWORD_PREFIX + token, user.id.toString());
            yield redis.expire(constants_1.FORGOT_PASSWORD_PREFIX + token, 60 * 60 * 24);
            const link = constants_1.__prod__
                ? `https://learncardsv2-client.herokuapp.com/change-password/${token}`
                : `http://localhost:3000/change-password/${token}`;
            yield (0, sendEmail_1.default)(email, `<div>Мы получили запрос на восстановления пароля вашего профиля в приложении LearnCards, чтобы изменить пароль пройдите по ссылке ниже, если вы не запрашивали смену пароля, то игнорируйте это письмо.<div><a href="${link}">reset passwod</a>`);
            return true;
        });
    }
    changePassword(token, newPassword, { redis }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newPassword.length <= 6) {
                return {
                    errors: [
                        {
                            field: "newPassword",
                            message: "length must be greater than 6",
                        },
                    ],
                };
            }
            const key = constants_1.FORGOT_PASSWORD_PREFIX + token;
            const getAsync = (0, util_1.promisify)(redis.get).bind(redis);
            const userId = (yield getAsync(key));
            if (!userId) {
                return {
                    errors: [
                        {
                            field: "token",
                            message: "token expired",
                        },
                    ],
                };
            }
            const user = yield User_1.User.findOne(parseInt(userId));
            if (!user) {
                return {
                    errors: [
                        {
                            field: "token",
                            message: "user no longer exists",
                        },
                    ],
                };
            }
            const hashedPassword = yield argon2_1.default.hash(newPassword);
            user.password = hashedPassword;
            yield user.save();
            redis.del(key);
            return { changed: true };
        });
    }
    logout({ req, res }) {
        return __awaiter(this, void 0, void 0, function* () {
            req;
            res;
            return true;
        });
    }
    getStats({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            let overallCards = 0;
            let learnedCards = 0;
            let createdDecks = 0;
            let studentsInCreatedDecks = 0;
            let overallLearnedPercent = 0;
            let learnedPercent = 0;
            let createdDecksArray = [];
            let learningDecksArray = [];
            let learnedOverallScore = 0;
            const decks = yield (0, typeorm_1.getConnection)()
                .getRepository(Deck_1.Deck)
                .createQueryBuilder("deck")
                .leftJoinAndSelect("deck.learners", "learners")
                .leftJoinAndSelect("deck.cards", "cards")
                .leftJoinAndSelect("deck.creator", "creator")
                .orderBy("cards.order", "ASC")
                .where("creator.id = :id", { id: req.user })
                .orWhere("learners.id = :id", { id: req.user })
                .getMany();
            const cardStats = yield (0, typeorm_1.getConnection)()
                .getRepository(CardStats_1.CardStats)
                .createQueryBuilder("stats")
                .where("stats.userId = :userId", { userId: req.user })
                .andWhere(`"cardId" IS NOT NULL`)
                .getMany();
            learnedCards = cardStats.length;
            cardStats.forEach((stats) => {
                learnedOverallScore += stats.lastPerformanceRating;
            });
            for (const deck of decks) {
                overallCards += deck.cards.length;
                if (deck.creator.id === req.user) {
                    createdDecks += 1;
                    studentsInCreatedDecks += deck.learners.length;
                    createdDecksArray.push(deck);
                }
                else {
                    const deckNew = yield yield (0, typeorm_1.getConnection)()
                        .getRepository(Deck_1.Deck)
                        .createQueryBuilder("deck")
                        .leftJoinAndSelect("deck.learners", "learners")
                        .leftJoinAndSelect("deck.cards", "cards")
                        .leftJoinAndSelect("deck.creator", "creator")
                        .where("deck.id = :deckId", { deckId: deck.id })
                        .getOne();
                    if (deckNew) {
                        learningDecksArray.push(deckNew);
                    }
                }
            }
            console.log("OVERALL SCORE ", learnedOverallScore);
            console.log("LEARNED CARDS ", learnedCards);
            overallLearnedPercent = parseFloat(((learnedOverallScore / overallCards) * 100).toFixed(2));
            learnedPercent = parseFloat(((learnedOverallScore / learnedCards) * 100).toFixed(2));
            return {
                overallCards,
                learnedCards,
                createdDecks,
                studentsInCreatedDecks,
                overallLearnedPercent: overallLearnedPercent ? overallLearnedPercent : 0,
                learnedPercent: learnedPercent ? learnedPercent : 0,
                createdDecksArray,
                learningDecksArray,
            };
        });
    }
};
__decorate([
    (0, type_graphql_1.Query)(() => User_1.User, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)("email")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => ChangePasswordResponse),
    __param(0, (0, type_graphql_1.Arg)("token")),
    __param(1, (0, type_graphql_1.Arg)("newPassword")),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "logout", null);
__decorate([
    (0, type_graphql_1.Query)(() => StatsResponse, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "getStats", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)()
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map