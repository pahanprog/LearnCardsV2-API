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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = void 0;
const typeorm_1 = require("typeorm");
const type_graphql_1 = require("type-graphql");
const Deck_1 = require("./Deck");
const CardStats_1 = require("./CardStats");
const Session_1 = require("./Session");
let Card = class Card extends typeorm_1.BaseEntity {
};
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Card.prototype, "id", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => String),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Card.prototype, "createdAt", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => String),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Card.prototype, "updatedAt", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Card.prototype, "order", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Card.prototype, "question", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Card.prototype, "answer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Deck_1.Deck, (deck) => deck.cards, {
        onDelete: "CASCADE",
    }),
    __metadata("design:type", Deck_1.Deck)
], Card.prototype, "deck", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => [CardStats_1.CardStats]),
    (0, typeorm_1.OneToMany)(() => CardStats_1.CardStats, (cardStats) => cardStats.card, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Card.prototype, "stats", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Session_1.Session, (session) => session.cards, {
        onDelete: "CASCADE",
    }),
    __metadata("design:type", Array)
], Card.prototype, "sessions", void 0);
Card = __decorate([
    (0, type_graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)()
], Card);
exports.Card = Card;
//# sourceMappingURL=Card.js.map