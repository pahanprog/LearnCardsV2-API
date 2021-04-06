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
exports.DeckResolver = exports.CardInputWithId = exports.CardInput = void 0;
const Deck_1 = require("../entities/Deck");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const isAuth_1 = require("../middleware/isAuth");
const Card_1 = require("../entities/Card");
const User_1 = require("../entities/User");
let DeckInput = class DeckInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], DeckInput.prototype, "title", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], DeckInput.prototype, "description", void 0);
DeckInput = __decorate([
    type_graphql_1.InputType()
], DeckInput);
let CardInput = class CardInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], CardInput.prototype, "question", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], CardInput.prototype, "answer", void 0);
CardInput = __decorate([
    type_graphql_1.InputType()
], CardInput);
exports.CardInput = CardInput;
let CardInputWithId = class CardInputWithId {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], CardInputWithId.prototype, "question", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], CardInputWithId.prototype, "answer", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", Number)
], CardInputWithId.prototype, "number", void 0);
__decorate([
    type_graphql_1.Field({ nullable: true }),
    __metadata("design:type", Number)
], CardInputWithId.prototype, "id", void 0);
CardInputWithId = __decorate([
    type_graphql_1.InputType()
], CardInputWithId);
exports.CardInputWithId = CardInputWithId;
let DeckResolver = class DeckResolver {
    decks({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decks = yield typeorm_1.getConnection()
                    .getRepository(Deck_1.Deck)
                    .createQueryBuilder("deck")
                    .leftJoinAndSelect("deck.learners", "learners")
                    .leftJoinAndSelect("deck.cards", "cards")
                    .orderBy("cards.number", "ASC")
                    .where("deck.creatorId = :id", { id: req.session.userId })
                    .orWhere("learners.id = :id", { id: req.session.userId })
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
            console.log(deckId);
            const deck = yield typeorm_1.getConnection()
                .getRepository(Deck_1.Deck)
                .createQueryBuilder("deck")
                .leftJoinAndSelect("deck.learners", "learners")
                .leftJoinAndSelect("deck.cards", "cards")
                .leftJoinAndSelect("deck.creator", "creator")
                .orderBy("cards.number", "ASC")
                .where("deck.id = :deckid", { deckid: deckId })
                .andWhere(new typeorm_1.Brackets((qb) => {
                qb.where("deck.creatorId = :crId", {
                    crId: req.session.userId,
                }).orWhere("learners.id = :lrId", { lrId: req.session.userId });
            }))
                .getOne();
            return deck;
        });
    }
    createDeck(input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({ where: { id: req.session.userId } });
            const deck = Deck_1.Deck.create({
                title: input.title,
                description: input.description,
                creatorId: req.session.userId,
                learners: [user],
            }).save();
            return deck;
        });
    }
    updateDeckInfo(id, input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const deck = yield typeorm_1.getConnection().manager.findOne(Deck_1.Deck, {
                relations: ["cards"],
                where: { id: id, creatorId: req.session.userId },
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
            yield typeorm_1.getConnection().manager.save(deck);
            return deck;
        });
    }
    updateDeckCards(deckId, update, del, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const check = yield typeorm_1.getConnection().manager.findOne(Deck_1.Deck, {
                where: { id: deckId, creatorId: req.session.userId },
            });
            if (!check) {
                return undefined;
            }
            yield update.forEach((value) => __awaiter(this, void 0, void 0, function* () {
                if (value.id) {
                    try {
                        const card = yield Card_1.Card.findOne({
                            where: { id: value.id, parentId: deckId },
                        });
                        card.answer = value.answer;
                        card.question = value.question;
                        typeorm_1.getConnection().manager.save(card);
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
                            parentId: deckId,
                            number: value.number,
                        }).save();
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            }));
            if (del) {
                yield del.forEach((value) => __awaiter(this, void 0, void 0, function* () {
                    yield typeorm_1.getConnection().manager.delete(Card_1.Card, { id: value.id });
                }));
            }
            const deck = typeorm_1.getConnection().manager.findOne(Deck_1.Deck, {
                relations: ["cards"],
                where: { id: deckId, creatorId: req.session.userId },
            });
            return deck;
        });
    }
    deleteDeck(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deck = yield typeorm_1.getConnection().manager.findOne(Deck_1.Deck, {
                    where: { id: id, creatorId: req.session.userId },
                });
                yield typeorm_1.getConnection().manager.remove(deck);
            }
            catch (e) {
                console.log(e);
                return false;
            }
            return true;
        });
    }
    startLearning(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deck = yield typeorm_1.getConnection().manager.findOne(Deck_1.Deck, {
                    relations: ["learners"],
                    where: { id: id },
                });
                if (!deck) {
                    return null;
                }
                const user = yield typeorm_1.getConnection().manager.findOne(User_1.User, {
                    where: { id: req.session.userId },
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
    deckSearch(title) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decks = yield typeorm_1.getConnection()
                    .getRepository(Deck_1.Deck)
                    .createQueryBuilder("deck")
                    .leftJoinAndSelect("deck.learners", "learners")
                    .leftJoinAndSelect("deck.cards", "cards")
                    .leftJoin("deck.creator", "creator")
                    .where("deck.title like :dTitle", { dTitle: `%${title}%` })
                    .orderBy("cards.number", "ASC")
                    .select(["deck", "cards", "learners.username", "creator.username"])
                    .getMany();
                return decks;
            }
            catch (er) {
                return null;
            }
        });
    }
};
__decorate([
    type_graphql_1.Query(() => [Deck_1.Deck], { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "decks", null);
__decorate([
    type_graphql_1.Query(() => Deck_1.Deck, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("deckId")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "deck", null);
__decorate([
    type_graphql_1.Mutation(() => Deck_1.Deck, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("input")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DeckInput, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "createDeck", null);
__decorate([
    type_graphql_1.Mutation(() => Deck_1.Deck, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id")),
    __param(1, type_graphql_1.Arg("input")),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, DeckInput, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "updateDeckInfo", null);
__decorate([
    type_graphql_1.Mutation(() => Deck_1.Deck, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("deckId")),
    __param(1, type_graphql_1.Arg("update", () => [CardInputWithId])),
    __param(2, type_graphql_1.Arg("del", () => [CardInputWithId], { nullable: true })),
    __param(3, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array, Array, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "updateDeckCards", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "deleteDeck", null);
__decorate([
    type_graphql_1.Mutation(() => Deck_1.Deck, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "startLearning", null);
__decorate([
    type_graphql_1.Query(() => [Deck_1.Deck], { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("title")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeckResolver.prototype, "deckSearch", null);
DeckResolver = __decorate([
    type_graphql_1.Resolver()
], DeckResolver);
exports.DeckResolver = DeckResolver;
//# sourceMappingURL=deck.js.map