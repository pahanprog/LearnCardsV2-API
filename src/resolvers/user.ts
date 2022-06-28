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
    if (!req.user) {
      return null;
    }

    const user = await User.findOne(req.user);
    return user;
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

    await sendEmail(
      email,
      `<div>Мы получили запрос на восстановления пароля вашего профиля в приложении LearnCards, чтобы изменить пароль пройдите по ссылке ниже, если вы не запрашивали смену пароля, то игнорируйте это письмо.<div><a href="${link}">reset passwod</a>`
    );

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

    const user = await User.findOne(parseInt(userId));

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
    req;
    res;
    return true;
  }
}
