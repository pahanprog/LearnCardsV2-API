import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
    console.log("IS AUTH ", context.req.isAuthenticated())
    if (!context.req.isAuthenticated()) {
        throw new Error("not aunthenticated");
    }
    return next();
};