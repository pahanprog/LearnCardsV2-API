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
let CardInput = class CardInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", Number)
], CardInput.prototype, "id", void 0);
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
let CardResolver = class CardResolver {
    updateCard(input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const card = yield typeorm_1.getConnection().manager.findOne(Card_1.Card, {
                where: { id: input.id },
            });
            const deck = yield typeorm_1.getConnection().manager.findOne(Deck_1.Deck, {
                where: { id: card === null || card === void 0 ? void 0 : card.parentId, creatorId: req.session.userId },
            });
            if (!deck) {
                return undefined;
            }
            if (!card) {
                return undefined;
            }
            if (typeof input.question !== "undefined") {
                card.question = input.question;
            }
            if (typeof input.answer !== "undefined") {
                card.answer = input.answer;
            }
            yield typeorm_1.getConnection().manager.save(card);
            return card;
        });
    }
};
__decorate([
    type_graphql_1.Mutation(() => Card_1.Card, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("input")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CardInput, Object]),
    __metadata("design:returntype", Promise)
], CardResolver.prototype, "updateCard", null);
CardResolver = __decorate([
    type_graphql_1.Resolver()
], CardResolver);
exports.CardResolver = CardResolver;
//# sourceMappingURL=card.js.map