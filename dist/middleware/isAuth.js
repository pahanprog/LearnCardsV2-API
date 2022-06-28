"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
const isAuth = ({ context }, next) => {
    console.log("IS AUTH ", context.req.isAuthenticated());
    if (!context.req.isAuthenticated()) {
        throw new Error("not aunthenticated");
    }
    return next();
};
exports.isAuth = isAuth;
//# sourceMappingURL=isAuth.js.map