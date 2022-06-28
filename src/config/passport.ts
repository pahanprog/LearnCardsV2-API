import passport from "passport";
import { User } from "../entities/User";
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const localStrategy = require("passport-local");
import argon2 from "argon2";
import * as dotenv from "dotenv";

import { __prod__ } from "../constants";

dotenv.config();

passport.serializeUser((req: any, user: any, done: any) => {
  req;
  if (user) done(null, user);
});

passport.deserializeUser(({ id }: User, done) => {
  User.findOne(id).then((user) => {
    done(undefined, { id: user?.id });
  });
});

passport.use(
  new localStrategy(
    {
      usernameField: "usernameOrEmail",
    },
    async (usernameOrEmail: any, password: any, done: any) => {
      const user = await User.findOne(
        usernameOrEmail.includes("@")
          ? { where: { email: usernameOrEmail } }
          : { where: { username: usernameOrEmail } }
      );

      if (!user) {
        return done(null, false, {
          message: [
            {
              field: "usernameOrEmail",
              message: "Пользователь с этими данными не существует",
            },
          ],
        });
      }

      const valid = await argon2.verify(user.password, password);
      if (!valid) {
        return done(null, false, {
          message: [
            {
              field: "password",
              message: "Неправильный пароль",
            },
          ],
        });
      }

      return done(null, user);
    }
  )
);

passport.use(
  new JWTstrategy(
    {
      secretOrKey: process.env.JWT_SECRET!,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (jwt: any, done: any) => {
      return done(null, jwt.id);
    }
  )
);
