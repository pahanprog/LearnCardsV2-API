import { Request, Response, NextFunction } from "express";
import { User } from "../entities/User";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import passport from "passport";
import { IVerifyOptions } from "passport-local";

require("../config/passport");

export const postRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("CALLED REGITER WITH ", req.body);
  const email = await User.findOne({
    where: [{ email: req.body.email }],
  });
  const username = await User.findOne({
    where: [{ username: req.body.username }],
  });
  if (email) {
    const errors = [{ field: "email", message: "Email уже зарегистрирован" }];
    if (username) {
      errors.push({ field: "username", message: "Логин уже зарегистрирован" });
    }
    res.send({
      errors,
    });
    return;
  } else if (username) {
    res.send({
      errors: [{ field: "username", message: "Логин уже зарегистрирован" }],
    });
    return;
  }

  const hashedPassword = await argon2.hash(req.body.password);
  const user = User.create({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });

  const saved = await user.save();

  if (saved) {
    req.logIn(user, { session: false }, async (err) => {
      if (err) {
        next(err);
        return;
      }
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);

      res.json({ token, id: user.id });
    });
  }
};

export const postLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "local",
    (err: Error, user: User, info: IVerifyOptions) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        res.send(JSON.stringify({ errors: info.message }));
        return;
      }
      req.logIn(user, { session: false }, async (err) => {
        if (err) {
          next(err);
          return;
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);

        res.json({
          token,
          id: user.id,
        });
      });
    }
  )(req, res, next);
};
