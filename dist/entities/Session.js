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
exports.Session = void 0;
const typeorm_1 = require("typeorm");
const type_graphql_1 = require("type-graphql");
const Deck_1 = require("./Deck");
const Card_1 = require("./Card");
const User_1 = require("./User");
let Session = class Session extends typeorm_1.BaseEntity {
};
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Session.prototype, "id", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => String),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Session.prototype, "createdAt", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => String),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Session.prototype, "updatedAt", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Session.prototype, "finishedCards", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => Deck_1.Deck),
    (0, typeorm_1.ManyToMany)(() => Deck_1.Deck, (deck) => deck.sessions, {
        onDelete: "CASCADE",
        cascade: true,
    }),
    __metadata("design:type", Deck_1.Deck)
], Session.prototype, "deck", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => User_1.User, (user) => user.sessions),
    __metadata("design:type", User_1.User)
], Session.prototype, "user", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => [Card_1.Card]),
    (0, typeorm_1.ManyToMany)(() => Card_1.Card, (card) => card.sessions, {
        onDelete: "CASCADE",
        cascade: true,
    }),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Session.prototype, "cards", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Number)
], Session.prototype, "cardsNumber", void 0);
Session = __decorate([
    (0, type_graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)()
], Session);
exports.Session = Session;
//# sourceMappingURL=Session.js.map