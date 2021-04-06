import { Card } from "../entities/Card";
import { Deck } from "../entities/Deck";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { castArray } from "lodash";

@InputType()
class CardInput {
  @Field()
  id: number;

  @Field()
  question: string;

  @Field()
  answer: string;
}

@Resolver()
export class CardResolver {
  @Mutation(() => Card, { nullable: true })
  @UseMiddleware(isAuth)
  async updateCard(
    @Arg("input") input: CardInput,
    @Ctx() { req }: MyContext
  ): Promise<Card | undefined> {
    const card = await getConnection().manager.findOne(Card, {
      where: { id: input.id },
    });

    const deck = await getConnection().manager.findOne(Deck, {
      where: { id: card?.parentId, creatorId: req.session.userId },
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

    await getConnection().manager.save(card);

    return card;
  }
}
