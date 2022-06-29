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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardResolver = void 0;
const Card_1 = require("../entities/Card");
const Deck_1 = require("../entities/Deck");
const isAuth_1 = require("../middleware/isAuth");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const CardStats_1 = require("../entities/CardStats");
const clamp_1 = require("../utils/clamp");
const shuffle_1 = require("../utils/shuffle");
const Session_1 = require("../entities/Session");
const User_1 = require("../entities/User");
const cardComparisonFunction = (a, b) => {
    if (a.stats[0].daysBetweenReviews > b.stats[0].daysBetweenReviews)
        return 1;
    if (a.stats[0].daysBetweenReviews < b.stats[0].daysBetweenReviews)
        return -1;
    return 0;
};
let CardInput = class CardInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Number)
], CardInput.prototype, "id", void 0);
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
let CardResolver = class CardResolver {
    updateCard(input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const card = yield (0, typeorm_1.getConnection)().manager.findOne(Card_1.Card, {
                relations: ["deck", "deck.creator"],
                where: { id: input.id },
            });
            if (!card) {
                return undefined;
            }
            if (!card.deck.creator.id === req.user) {
                return undefined;
            }
            if (typeof input.question !== "undefined") {
                card.question = input.question;
            }
            if (typeof input.answer !== "undefined") {
                card.answer = input.answer;
            }
            yield (0, typeorm_1.getConnection)().manager.save(card);
            return card;
        });
    }
    calculateStats(performanceRating, sessionId, id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("START");
            const user = yield User_1.User.findOne(req.user, { relations: ["stats"] });
            if (!user) {
                return null;
            }
            console.log("SESSION");
            const session = yield Session_1.Session.findOne(sessionId);
            if (!session) {
                return null;
            }
            console.log("CARD");
            const card = yield Card_1.Card.findOne(id);
            if (!card) {
                return null;
            }
            const stat = yield (0, typeorm_1.getConnection)()
                .getRepository(CardStats_1.CardStats)
                .createQueryBuilder("stats")
                .where("stats.userId = :userId", { userId: req.user })
                .andWhere("stats.cardId = :cardId", { cardId: id })
                .getOne();
            console.log("CARD STAT", stat);
            const now = new Date();
            let saved = null;
            if (stat) {
                console.log("STATS");
                const percentOverdue = performanceRating >= 0.6
                    ? Math.min(2, Math.ceil(now.getTime() -
                        stat.dateLastReviewed.getTime() / (1000 * 3600 * 24)) / stat.daysBetweenReviews)
                    : 1;
                stat.difficulty = (0, clamp_1.clamp)(stat.difficulty +
                    percentOverdue * ((1 / 17) * (8 - 9 * performanceRating)), 0, 1);
                const difficultyWeight = 3 - 1.7 * stat.difficulty;
                stat.daysBetweenReviews =
                    stat.daysBetweenReviews *
                        (performanceRating >= 0.6
                            ? 1 +
                                (difficultyWeight - 1) *
                                    percentOverdue *
                                    Math.random() *
                                    (1.05 - 0.95) +
                                0.95
                            : Math.min(1 / (1 + 3 * stat.difficulty), 1));
                stat.dateLastReviewed = now;
                stat.lastPerformanceRating = performanceRating;
                saved = yield stat.save();
            }
            else {
                console.log("NO STATS");
                const percentOverdue = performanceRating >= 0.6 ? 2 : 1;
                const difficulty = (0, clamp_1.clamp)(0.3 + ((percentOverdue * 1) / 17) * (8 - 9 * performanceRating), 0, 1);
                const difficultyWeight = 3 - 1.7 * difficulty;
                const daysBetweenReviews = performanceRating >= 0.6
                    ? 1 +
                        (difficultyWeight - 1) *
                            percentOverdue *
                            Math.random() *
                            (1.05 - 0.95) +
                        0.95
                    : Math.min(1 / (1 + 3 * difficulty), 1);
                saved = yield CardStats_1.CardStats.create({
                    difficulty,
                    daysBetweenReviews,
                    dateLastReviewed: now,
                    lastPerformanceRating: performanceRating,
                    user: user,
                    card: card,
                }).save();
            }
            session.finishedCards = session.finishedCards + 1;
            session.save();
            return saved;
        });
    }
    startLearningSession(deckId, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("SESSION START");
            const user = yield User_1.User.findOne(req.user, { relations: ["sessions"] });
            if (!user) {
                return null;
            }
            console.log("DECK");
            const deck = yield (0, typeorm_1.getConnection)()
                .getRepository(Deck_1.Deck)
                .createQueryBuilder("deck")
                .leftJoinAndSelect("deck.sessions", "sessions")
                .leftJoinAndSelect("sessions.user", "user", "user.id = :userId", {
                userId: req.user,
            })
                .where("deck.id = :deckId", { deckId })
                .getOne();
            if (!deck) {
                return null;
            }
            console.log("DECK ", deck);
            let final = [];
            console.log("CARDS");
            const cards = yield (0, typeorm_1.getConnection)()
                .getRepository(Card_1.Card)
                .createQueryBuilder("card")
                .where("card.deckId = :deckId", { deckId })
                .orderBy("card.order")
                .getMany();
            if (cards.length === 0) {
                return null;
            }
            console.log("CARDS ", cards);
            if (deck.sessions.length === 0) {
                console.log("FIRST SESSION");
                final = (0, shuffle_1.shuffle)(cards);
                final = final.splice(0, 10);
                if (final.length < 10) {
                    console.log("TO SMALL ", final.length);
                    let flag = true;
                    while (flag) {
                        console.log("ADDING ITEM");
                        final.push(final[Math.floor(Math.random() * final.length)]);
                        if (final.length === 10) {
                            flag = false;
                        }
                    }
                }
            }
            else {
                console.log("NOT FIRST SESSION");
                let noStats = [];
                let haveStats = [];
                let cardsCopy = cards;
                console.log("Should calculate overdue");
                for (const card of cardsCopy) {
                    const stats = yield CardStats_1.CardStats.findOne({
                        where: { user: user, card: card },
                    });
                    console.log("FETCHED STATS FOR CARD ", card, " : ", stats);
                    if (stats) {
                        card.stats = [stats];
                        haveStats.push(card);
                    }
                    else {
                        noStats.push(card);
                    }
                }
                console.log("Initial ", cards.length, "\nhave no stats ", noStats.length, "\nhave stats ", haveStats.length);
                haveStats.sort(cardComparisonFunction);
                console.log("SORTED WITH STATS ", haveStats);
                if (noStats.length < 10 && haveStats.length > 0) {
                    console.log("FIRST FLAG");
                    final = noStats;
                    let i = 0;
                    console.log("FINAL LENGHT ", final.length);
                    let flag = true;
                    while (flag) {
                        console.log("FINAL LENGHT ", final.length, " I ", i);
                        final.push(haveStats[i]);
                        i++;
                        if (i === haveStats.length || final.length === 10) {
                            flag = false;
                        }
                    }
                    console.log("FINAL LENGHT AFTER WHILE ", final.length);
                    if (final.length < 10) {
                        console.log("TO SMALL ", final.length);
                        let flag = true;
                        while (flag) {
                            console.log("ADDING ITEM");
                            final.push(final[Math.floor(Math.random() * final.length)]);
                            if (final.length === 10) {
                                flag = false;
                            }
                        }
                    }
                }
                else if (noStats.length >= 10) {
                    console.log("SECOND FLAG");
                    final = noStats.slice(0, 10);
                }
                else {
                    final = (0, shuffle_1.shuffle)(cards);
                    final = final.splice(0, 10);
                    if (final.length < 10) {
                        console.log("TO SMALL ", final.length);
                        let flag = true;
                        while (flag) {
                            console.log("ADDING ITEM");
                            final.push(final[Math.floor(Math.random() * final.length)]);
                            if (final.length === 10) {
                                flag = false;
                            }
                        }
                    }
                    console.log("WHAT TO DO NOW");
                }
            }
            final = (0, shuffle_1.shuffle)(final);
            console.log("FINAL ARRAY \n");
            console.log("LENGHT ", final.length, "\n");
            final.forEach((i) => {
                console.log("Item ", i);
            });
            const session = yield Session_1.Session.create({}).save();
            const newSessionsUser = user.sessions;
            newSessionsUser.push(session);
            const newSessionsDeck = deck.sessions;
            newSessionsDeck.push(session);
            user.sessions = newSessionsUser;
            yield user.save();
            deck.sessions = newSessionsDeck;
            yield deck.save();
            session.cards = final;
            session.cardsNumber = session.cards.length;
            return session;
        });
    }
    getCardFromSession(sessionId, cardId, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield (0, typeorm_1.getConnection)()
                .getRepository(Session_1.Session)
                .createQueryBuilder("session")
                .where('"session"."id" = :sessionId', { sessionId })
                .getOne();
            const card = yield Card_1.Card.findOne(cardId);
            if (!session || !card) {
                return null;
            }
            return card;
        });
    }
};
__decorate([
    (0, type_graphql_1.Mutation)(() => Card_1.Card, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("input")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CardInput, Object]),
    __metadata("design:returntype", Promise)
], CardResolver.prototype, "updateCard", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => CardStats_1.CardStats, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("performanceRating")),
    __param(1, (0, type_graphql_1.Arg)("sessionId")),
    __param(2, (0, type_graphql_1.Arg)("id")),
    __param(3, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], CardResolver.prototype, "calculateStats", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Session_1.Session, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("deckId")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CardResolver.prototype, "startLearningSession", null);
__decorate([
    (0, type_graphql_1.Query)(() => Card_1.Card, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)("sessionId")),
    __param(1, (0, type_graphql_1.Arg)("cardId")),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], CardResolver.prototype, "getCardFromSession", null);
CardResolver = __decorate([
    (0, type_graphql_1.Resolver)()
], CardResolver);
exports.CardResolver = CardResolver;
//# sourceMappingURL=card.js.map