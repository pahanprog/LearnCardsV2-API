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
exports.CardStats = void 0;
const typeorm_1 = require("typeorm");
const type_graphql_1 = require("type-graphql");
const Card_1 = require("./Card");
const User_1 = require("./User");
let CardStats = class CardStats extends typeorm_1.BaseEntity {
};
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CardStats.prototype, "id", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => String),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CardStats.prototype, "createdAt", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => String),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CardStats.prototype, "updatedAt", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: 0.3, type: "float" }),
    __metadata("design:type", Number)
], CardStats.prototype, "difficulty", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: "float" }),
    __metadata("design:type", Number)
], CardStats.prototype, "daysBetweenReviews", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.Column)({}),
    __metadata("design:type", Date)
], CardStats.prototype, "dateLastReviewed", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: "float" }),
    __metadata("design:type", Number)
], CardStats.prototype, "lastPerformanceRating", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Card_1.Card, (card) => card.stats, { onDelete: "CASCADE" }),
    __metadata("design:type", Card_1.Card)
], CardStats.prototype, "card", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.stats),
    __metadata("design:type", User_1.User)
], CardStats.prototype, "user", void 0);
CardStats = __decorate([
    (0, type_graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)()
], CardStats);
exports.CardStats = CardStats;
//# sourceMappingURL=CardStats.js.map