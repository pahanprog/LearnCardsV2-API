import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { MyContext } from "../types";
import argon2 from "argon2";
import { getConnection } from "typeorm";
import { RegisterInput } from "./RegisterInput";
import validateRegister from "../utils/ValidateRegister";
import { v4 } from "uuid";
import sendEmail from "../utils/sendEmail";
import { FORGOT_PASSWORD_PREFIX, __prod__ } from "../constants";
import { promisify } from "util";
import { get } from "https";
@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@ObjectType()
class ChangePasswordResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Boolean, { nullable: true })
  changed?: Boolean;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    if (!req.session!.userId) {
      return null;
    }

    const user = await getConnection().manager.findOne(User, {
      where: { id: req.session.userId },
    });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: RegisterInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          email: options.email,
          username: options.username,
          password: hashedPassword,
        })
        .returning("*")
        .execute();
      user = result.raw[0];
    } catch (err) {
      if (err.code === "23505") {
        if (err.detail.includes("email")) {
          return {
            errors: [{ field: "email", message: "Email already exists" }],
          };
        } else {
          return {
            errors: [
              {
                field: "username",
                message: "username already exists",
              },
            ],
          };
        }
      } else {
        console.error(err);
      }
    }

    req.session!.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("UsernameOrEmail") UsernameOrEmail: string,
    @Arg("Password") Password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await getConnection().manager.findOne(
      User,
      UsernameOrEmail.includes("@")
        ? { where: { email: UsernameOrEmail } }
        : { where: { username: UsernameOrEmail } }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "username or email not found",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, Password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }

    req.session!.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return true;
    }

    const token = v4();

    await redis.set(FORGOT_PASSWORD_PREFIX + token, user.id.toString());
    await redis.expire(FORGOT_PASSWORD_PREFIX + token, 60 * 60 * 24);
    const link = __prod__
      ? `https://learncardsv2-client.herokuapp.com/change-password/${token}`
      : `http://localhost:3000/change-password/${token}`;

    await sendEmail(email, `<a href="${link}">reset passwod</a>`);

    return true;
  }

  @Mutation(() => ChangePasswordResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis }: MyContext
  ) {
    if (newPassword.length <= 6) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 6",
          },
        ],
      };
    }

    const key = FORGOT_PASSWORD_PREFIX + token;
    const getAsync = promisify(redis.get).bind(redis);

    const userId: string = (await getAsync(key)) as string;

    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const user = await User.findOne({ where: { id: parseInt(userId) } });

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(newPassword);
    user.password = hashedPassword;

    await user.save();

    redis.del(key);

    return { changed: true };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie("qid");
        if (err) {
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
