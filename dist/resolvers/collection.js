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
exports.CollectionResolver = void 0;
const Collection_1 = require("../entities/Collection");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
let CollectionResolver = class CollectionResolver {
    collections() {
        return __awaiter(this, void 0, void 0, function* () {
            return typeorm_1.getConnection().manager.find(Collection_1.Collection, { relations: ["questions"] });
        });
    }
    collection(id) {
        return typeorm_1.getConnection().manager.findOne(Collection_1.Collection, { relations: ["questions"], where: { id: id } });
    }
    createCollection(title, description) {
        return __awaiter(this, void 0, void 0, function* () {
            const collecion = new Collection_1.Collection();
            collecion.title = title;
            collecion.description = description;
            yield typeorm_1.getConnection().manager.save(collecion);
            return collecion;
        });
    }
    updateCollection(id, title, description) {
        return __awaiter(this, void 0, void 0, function* () {
            const collecion = yield typeorm_1.getConnection().manager.findOne(Collection_1.Collection, { relations: ["questions"], where: { id: id } });
            if (!collecion) {
                return null;
            }
            if (typeof title !== "undefined") {
                collecion.title = title;
            }
            if (typeof description !== "undefined") {
                collecion.description = description;
            }
            yield typeorm_1.getConnection().manager.save(collecion);
            return collecion;
        });
    }
    deleteCollection(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const collection = yield typeorm_1.getConnection().manager.findOne(Collection_1.Collection, { where: { id: id } });
                yield typeorm_1.getConnection().manager.remove(collection);
            }
            catch (e) {
                return false;
            }
            return true;
        });
    }
};
__decorate([
    type_graphql_1.Query(() => [Collection_1.Collection]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CollectionResolver.prototype, "collections", null);
__decorate([
    type_graphql_1.Query(() => Collection_1.Collection, { nullable: true }),
    __param(0, type_graphql_1.Arg("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CollectionResolver.prototype, "collection", null);
__decorate([
    type_graphql_1.Mutation(() => Collection_1.Collection),
    __param(0, type_graphql_1.Arg("title")),
    __param(1, type_graphql_1.Arg("description")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollectionResolver.prototype, "createCollection", null);
__decorate([
    type_graphql_1.Mutation(() => Collection_1.Collection, { nullable: true }),
    __param(0, type_graphql_1.Arg("id")),
    __param(1, type_graphql_1.Arg("title", { nullable: true })),
    __param(2, type_graphql_1.Arg("description", { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], CollectionResolver.prototype, "updateCollection", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Arg("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CollectionResolver.prototype, "deleteCollection", null);
CollectionResolver = __decorate([
    type_graphql_1.Resolver()
], CollectionResolver);
exports.CollectionResolver = CollectionResolver;
//# sourceMappingURL=collection.js.map