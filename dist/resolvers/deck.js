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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeckResolver = exports.CardInputWithId = exports.CardInput = void 0;
const Deck_1 = require("../entities/Deck");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const Card_1 = require("../entities/Card");
const User_1 = require("../entities/User");
const isAuth_1 = require("../middleware/isAuth");
const CardStats_1 = require("../entities/CardStats");
const Session_1 = require("../entities/Session");
let DeckInput = class DeckInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], DeckInput.prototype, "title", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], DeckInput.prototype, "description", void 0);
DeckInput = __decorate([
    (0, type_graphql_1.InputType)()
], DeckInput);
let CardInput = class CardInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], CardInput.prototype, "question", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], CardInput.prototype, "answer", void 0);
CardInput = __decorate([
    (0, type_graphql_1.InputType)()
], CardInput);
exports.CardInput = CardInput;
let CardInputWithId = class CardInputWithId {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], CardInputWithId.prototype, "question", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], CardInputWithId.prototype, "answer", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Number)
], CardInputWithId.prototype, "order", void 0);
__decorate([
    (0, type_graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], CardInputWithId.prototype, "id", void 0);
CardInputWithId = __decorate([
    (0, type_graphql_1.InputType)()
], CardInputWithId);
exports.CardInputWithId = CardInputWithId;
let DeckResolver = class DeckResolver {
    canEdit(deck, { req }) {
        return deck.creator.id === req.user;
    }
    isLearner(deck, { req }) {
        return deck.creator.id !== req.user;
    }
    decks({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
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
                return decks;
            }
            catch (e) {
                console.log(e);
                return null;
            }
        });
    }
    deck(deckId, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const deck = yield (0, typeorm_1.getConnection)()
                .getRepository(Deck_1.Deck)
                .createQueryBuilder("deck")
                .leftJoinAndSelect("deck.learners", "learners")
                .leftJoinAndSelect("deck.cards", "cards")
                .leftJoinAndSelect("deck.creator", "creator")
                .leftJoinAndSelect("cards.stats", "stats")
                .leftJoinAndSelect("stats.user", "user", "user.id = :userId", {
                userId: req.user,
            })
                .orderBy("cards.order", "ASC")
                .where("deck.id = :deckid", { deckid: deckId })
                .andWhere(new typeorm_1.Brackets((qb) => {
                qb.where("creator.id = :crId", {
                    crId: req.user,
                }).orWhere("learners.id = :lrId", { lrId: req.user });
            }))
                .getOne();
            console.log("DECK ", deck);
            if (deck) {
                for (const l of deck === null || deck === void 0 ? void 0 : deck.learners) {
                    console.log("Learner ", l);
                    let performanceRatingArray = [];
                    const overAll = yield (0, typeorm_1.getConnection)()
                        .getRepository(Session_1.Session)
                        .createQueryBuilder("session")
                        .leftJoinAndSelect("session.deck", "deck", "deck.id = :deckId", {
                        deckId,
                    })
                        .leftJoinAndSelect("session.user", "user", "user.id = :userId", {
                        userId: l.id,
                    })
                        .where("user.id IS NOT NULL")
                        .getMany();
                    console.log("OVER ALL ", overAll);
                    let overAllSum = 0;
                    overAll.forEach((sess) => {
                        console.log("SESSION ", sess);
                        overAllSum = overAllSum + sess.finishedCards;
                    });
                    console.log("OVER ALL SUM", overAllSum);
                    for (const c of deck.cards) {
                        const stats = yield (0, typeorm_1.getConnection)()
                            .getRepository(CardStats_1.CardStats)
                            .createQueryBuilder("stats")
                            .leftJoinAndSelect("stats.card", "card")
                            .leftJoinAndSelect("stats.user", "user")
                            .where("card.id = :cardId", { cardId: c.id })
                            .andWhere("user.id = :userId", { userId: l.id })
                            .getOne();
                        console.log("STATS ", stats);
                        if (stats) {
                            performanceRatingArray.push(stats.lastPerformanceRating);
                        }
                    }
                    console.log("performanceRatingArray ", performanceRatingArray);
                    console.log("CARDS LENGHT ", deck.cards.length);
                    const percent = parseFloat(((performanceRatingArray.reduce((sum, perf) => sum + perf, 0) /
                        deck.cards.length) *
                        100).toFixed(2));
                    l.deckStats = {
                        overall: overAllSum,
                        percent: percent ? percent : 0,
                        unique: performanceRatingArray.length,
                    };
                }
            }
            console.log("RETURNING ");
            return deck;
        });
    }
    createDeck(input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({ where: { id: req.user } });
            const deck = Deck_1.Deck.create({
                title: input.title,
                description: input.description,
                creator: user,
                learners: [user],
            }).save();
            return deck;
        });
    }
    updateDeckInfo(id, input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const deck = yield (0, typeorm_1.getConnection)().manager.findOne(Deck_1.Deck, {
                relations: ["cards"],
                where: { id: id, creator: req.user },
            });
            if (!deck) {
                return null;
            }
            if (typeof input.title !== "undefined") {
                deck.title = input.title;
            }
            if (typeof input.description !== "undefined") {
                deck.description = input.description;
            }
            yield (0, typeorm_1.getConnection)().manager.save(deck);
            return deck;
        });
    }
    updateDeckCards(deckId, update, del, { req }) {
        var update_1, update_1_1, del_1, del_1_1;
        var e_1, _a, e_2, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const check = yield (0, typeorm_1.getConnection)().manager.findOne(Deck_1.Deck, {
                where: { id: deckId, creator: req.user },
                relations: ["cards"],
            });
            if (!check) {
                return undefined;
            }
            try {
                for (update_1 = __asyncValues(update); update_1_1 = yield update_1.next(), !update_1_1.done;) {
                    const value = update_1_1.value;
                    if (value.id) {
                        try {
                            const card = yield Card_1.Card.findOne({
                                where: { id: value.id, deck: check },
                            });
                            card.answer = value.answer;
                            card.question = value.question;
                            card.order = value.order;
                            yield (card === null || card === void 0 ? void 0 : card.save());
                        }
                        catch (err) {
                            console.error(err);
                        }
                    }
                    else {
                        try {
                            yield Card_1.Card.create({
                                answer: value.answer,
                                question: value.question,
                                order: value.order,
                                deck: check,
                            }).save();
                        }
                        catch (err) {
                            console.error(err);
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (update_1_1 && !update_1_1.done && (_a = update_1.return)) yield _a.call(update_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (del) {
                try {
                    for (del_1 = __asyncValues(del); del_1_1 = yield del_1.next(), !del_1_1.done;) {
                        const value = del_1_1.value;
                        yield (0, typeorm_1.getConnection)().manager.delete(Card_1.Card, { id: value.id });
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (del_1_1 && !del_1_1.done && (_b = del_1.return)) yield _b.call(del_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            const deck = yield (0, typeorm_1.getConnection)()
                .getRepository(Deck_1.Deck)
                .createQueryBuilder("deck")
                .leftJoinAndSelect("deck.cards", "cards")
                .where("deck.id = :deckId", { deckId })
                .orderBy("cards.order", "ASC")
                .getOne();
            return deck;
        });
    }
    deleteDeck(id, isLearner, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isLearner) {
                try {
                    const deck = yield (0, typeorm_1.getConnection)().manager.findOne(Deck_1.Deck, {
                        relations: ["learners", "creator"],
                        where: { id: id },
                    });
                    if (!deck) {
                        return false;
                    }
                    const filtered = deck.learners.filter((el) => {
                        return el.id != req.user;
                    });
                    deck.learners = filtered;
                    yield deck.save();
                    return true;
                }
                catch (e) {
                    console.log(e);
                    return false;
                }
            }
            else {
                try {
                    const deck = yield (0, typeorm_1.getConnection)().manager.findOne(Deck_1.Deck, {
                        where: { id: id, creator: req.user },
                    });
                    yield (0, typeorm_1.getConnection)().manager.remove(deck);
                }
                catch (e) {
                    console.log(e);
                    return false;
                }
            }
            return true;
        });
    }
    startLearning(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deck = yield (0, typeorm_1.getConnection)().manager.findOne(Deck_1.Deck, {
                    relations: ["learners", "creator"],
                    where: { id: id },
                });
                if (!deck) {
                    return null;
                }
                const user = yield (0, typeorm_1.getConnection)().manager.findOne(User_1.User, {
                    where: { id: req.user },
                });
                deck.learners.push(user);
                yield deck.save();
                return deck;
            }
            catch (e) {
                console.log(e);
                return null;
            }
        });
    }
    deckSearch(title, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decks = yield (0, typeorm_1.getConnection)()
                    .getRepository(Deck_1.Deck)
                    .createQueryBuilder("deck")
                    .leftJoinAndSelect("deck.learners", "learners")
                    .leftJoinAndSelect("deck.cards", "cards")
                    .leftJoin("deck.creator", "creator")
                    .where("LOWER(deck.title) like :dTitle", {
                    dTitle: `%${title.toLowerCase()}%`,
                })
                    .orWhere("LOWER(deck.description) like :dTitle", {
                    dTitle: `%${title.toLowerCase()}%`,
                })
                    .andWhere("creator.id != :id", { id: req.user })
                    .orderBy("cards.order", "ASC")
                    .select(["deck", "cards", "learners.username", "creator.username"])
                    .getMany();
                return decks;
            }
            catch (er) {
                return null;
            }
        });
    }
    discover({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield (0, typeorm_1.getConnection)().query(`SELECT deck."id", COUNT("user"."id") FROM "deck" JOIN "deck_learners_user" ON "deck_learners_user"."deckId" = "deck"."id" JOIN "user" ON "user"."id" = "deck_learners_user"."userId" GROUP BY "deck"."id" ORDER BY "count" DESC`);
                const ids = order.map((i) => i.id);
                const decks = yield Deck_1.Deck.find({
                    where: { id: (0, typeorm_1.In)(ids) },
                    relations: ["creator", "learners", "cards"],
                });
                return decks;
            }
            catch (err) {
                return null;
            }
        });
    }
};
__decorate([
    (0, type_graphql_1.FieldResolver)(() => Boolean),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Deck_1.Deck, Object]),
    __metadata("design:returntype", void 0)
], DeckResolver.prototype, "canEdit", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(() => Boolean),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Deck_1.Deck, Object]),
    __metadata("design:returntype", void 0)
], DeckResolver.prototype, "isLearner", null);
__decorate([
    (0, type_graphql_1.Query)(() => [Deck_1.Deck], { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "decks", null);
__decorate([
    (0, type_graphql_1.Query)(() => Deck_1.Deck, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("deckId")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "deck", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Deck_1.Deck, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("input")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DeckInput, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "createDeck", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Deck_1.Deck, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id")),
    __param(1, (0, type_graphql_1.Arg)("input")),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, DeckInput, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "updateDeckInfo", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Deck_1.Deck, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("deckId")),
    __param(1, (0, type_graphql_1.Arg)("update", () => [CardInputWithId])),
    __param(2, (0, type_graphql_1.Arg)("del", () => [CardInputWithId], { nullable: true })),
    __param(3, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array, Array, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "updateDeckCards", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id")),
    __param(1, (0, type_graphql_1.Arg)("isLearner")),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Boolean, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "deleteDeck", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Deck_1.Deck, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("id")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "startLearning", null);
__decorate([
    (0, type_graphql_1.Query)(() => [Deck_1.Deck], { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("title")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "deckSearch", null);
__decorate([
    (0, type_graphql_1.Query)(() => [Deck_1.Deck], { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "discover", null);
DeckResolver = __decorate([
    (0, type_graphql_1.Resolver)(() => Deck_1.Deck)
], DeckResolver);
exports.DeckResolver = DeckResolver;
//# sourceMappingURL=deck.js.map