import { Deck } from "../entities/Deck";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { Brackets, getConnection, In } from "typeorm";
import { MyContext } from "../types";
import { Card } from "../entities/Card";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { CardStats } from "../entities/CardStats";
import { Console } from "console";
import { Session } from "../entities/Session";

@InputType()
class DeckInput {
  @Field()
  title: string;

  @Field()
  description: string;
}

@InputType()
export class CardInput {
  @Field()
  question!: string;

  @Field()
  answer!: string;
}

@InputType()
export class CardInputWithId {
  @Field()
  question!: string;

  @Field()
  answer!: string;

  @Field()
  order!: number;

  @Field({ nullable: true })
  id?: number;
}

@Resolver(() => Deck)
export class DeckResolver {
  @FieldResolver(() => Boolean)
  canEdit(@Root() deck: Deck, @Ctx() { req }: MyContext) {
    return deck.creator.id === req.user;
  }

  @FieldResolver(() => Boolean)
  isLearner(@Root() deck: Deck, @Ctx() { req }: MyContext) {
    return deck.creator.id !== req.user;
  }

  @Query(() => [Deck], { nullable: true })
  @UseMiddleware(isAuth)
  async decks(@Ctx() { req }: MyContext): Promise<Deck[] | null> {
    try {
      const decks = await getConnection()
        .getRepository(Deck)
        .createQueryBuilder("deck")
        .leftJoinAndSelect("deck.learners", "learners")
        .leftJoinAndSelect("deck.cards", "cards")
        .leftJoinAndSelect("deck.creator", "creator")
        .orderBy("cards.order", "ASC")
        .where("creator.id = :id", { id: req.user })
        .orWhere("learners.id = :id", { id: req.user })
        .getMany();
      return decks;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  @Query(() => Deck, { nullable: true })
  @UseMiddleware(isAuth)
  async deck(
    @Arg("deckId") deckId: number,
    @Ctx() { req }: MyContext
  ): Promise<Deck | undefined> {
    const deck = await getConnection()
      .getRepository(Deck)
      .createQueryBuilder("deck")
      .leftJoinAndSelect("deck.learners", "learners")
      .leftJoinAndSelect("deck.cards", "cards")
      .leftJoinAndSelect("deck.creator", "creator")
      .leftJoinAndSelect("cards.stats", "stats")
      .leftJoinAndSelect("stats.user", "user", "user.id = :userId", {
        userId: req.user,
      })
      .orderBy("cards.order", "ASC")
      .where("deck.id = :deckid", { deckid: deckId })
      .andWhere(
        new Brackets((qb) => {
          qb.where("creator.id = :crId", {
            crId: req.user,
          }).orWhere("learners.id = :lrId", { lrId: req.user });
        })
      )
      .getOne();
    console.log("DECK ", deck);
    if (deck) {
      for (const l of deck?.learners) {
        console.log("Learner ", l);
        let performanceRatingArray = [];
        const overAll = await getConnection()
          .getRepository(Session)
          .createQueryBuilder("session")
          .leftJoinAndSelect("session.deck", "deck", "deck.id = :deckId", {
            deckId,
          })
          .leftJoinAndSelect("session.user", "user", "user.id = :userId", {
            userId: l.id,
          })
          .where("user.id IS NOT NULL")
          .getMany();
        console.log("OVER ALL ", overAll);
        let overAllSum = 0;
        overAll.forEach((sess) => {
          console.log("SESSION ", sess);
          overAllSum = overAllSum + sess.finishedCards;
        });
        console.log("OVER ALL SUM", overAllSum);
        for (const c of deck.cards) {
          const stats = await getConnection()
            .getRepository(CardStats)
            .createQueryBuilder("stats")
            .leftJoinAndSelect("stats.card", "card")
            .leftJoinAndSelect("stats.user", "user")
            .where("card.id = :cardId", { cardId: c.id })
            .andWhere("user.id = :userId", { userId: l.id })
            .getOne();
          console.log("STATS ", stats);
          if (stats) {
            performanceRatingArray.push(stats.lastPerformanceRating);
          }
        }
        console.log("performanceRatingArray ", performanceRatingArray);
        console.log("CARDS LENGHT ", deck.cards.length);
        const percent = parseFloat(
          (
            (performanceRatingArray.reduce((sum, perf) => sum + perf, 0) /
              deck.cards.length) *
            100
          ).toFixed(2)
        );
        l.deckStats = {
          overall: overAllSum,
          percent: percent ? percent : 0,
          unique: performanceRatingArray.length,
        };
      }
    }
    console.log("RETURNING ");
    return deck;
  }

  @Mutation(() => Deck, { nullable: true })
  @UseMiddleware(isAuth)
  async createDeck(
    @Arg("input") input: DeckInput,
    @Ctx() { req }: MyContext
  ): Promise<Deck | null> {
    const user = await User.findOne({ where: { id: req.user } });

    const deck = Deck.create({
      title: input.title,
      description: input.description,
      creator: user,
      learners: [user!],
    }).save();

    return deck;
  }

  @Mutation(() => Deck, { nullable: true })
  @UseMiddleware(isAuth)
  async updateDeckInfo(
    @Arg("id") id: number,
    @Arg("input") input: DeckInput,
    @Ctx() { req }: MyContext
  ): Promise<Deck | null> {
    const deck = await getConnection().manager.findOne(Deck, {
      relations: ["cards"],
      where: { id: id, creator: req.user },
    });
    if (!deck) {
      return null;
    }
    if (typeof input.title !== "undefined") {
      deck.title = input.title;
    }
    if (typeof input.description !== "undefined") {
      deck.description = input.description;
    }
    await getConnection().manager.save(deck);
    return deck;
  }

  @Mutation(() => Deck, { nullable: true })
  @UseMiddleware(isAuth)
  async updateDeckCards(
    @Arg("deckId") deckId: number,
    @Arg("update", () => [CardInputWithId]) update: CardInputWithId[],
    @Arg("del", () => [CardInputWithId], { nullable: true })
    del: CardInputWithId[],
    @Ctx() { req }: MyContext
  ): Promise<Deck | undefined> {
    const check = await getConnection().manager.findOne(Deck, {
      where: { id: deckId, creator: req.user },
      relations: ["cards"],
    });

    if (!check) {
      return undefined;
    }

    for await (const value of update) {
      if (value.id) {
        try {
          const card = await Card.findOne({
            where: { id: value.id, deck: check },
          });
          card!.answer = value.answer;
          card!.question = value.question;
          card!.order = value.order;
          await card?.save();
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          await Card.create({
            answer: value.answer,
            question: value.question,
            order: value.order,
            deck: check,
          }).save();
        } catch (err) {
          console.error(err);
        }
      }
    }
    if (del) {
      for await (const value of del) {
        await getConnection().manager.delete(Card, { id: value.id });
      }
    }

    // const deck = await getConnection().manager.findOne(Deck, {
    //   relations: ["cards"],
    //   where: { id: deckId, creator: req.user },
    // });

    const deck = await getConnection()
      .getRepository(Deck)
      .createQueryBuilder("deck")
      .leftJoinAndSelect("deck.cards", "cards")
      .where("deck.id = :deckId", { deckId })
      .orderBy("cards.order", "ASC")
      .getOne();

    return deck;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteDeck(
    @Arg("id") id: number,
    @Arg("isLearner") isLearner: boolean,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    if (isLearner) {
      try {
        const deck = await getConnection().manager.findOne(Deck, {
          relations: ["learners", "creator"],
          where: { id: id },
        });

        if (!deck) {
          return false;
        }

        const filtered = deck!.learners.filter((el) => {
          return el.id != req.user;
        });
        deck!.learners = filtered;

        await deck!.save();

        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    } else {
      try {
        const deck = await getConnection().manager.findOne(Deck, {
          where: { id: id, creator: req.user },
        });
        await getConnection().manager.remove(deck);
      } catch (e) {
        console.log(e);
        return false;
      }
    }
    return true;
  }

  @Mutation(() => Deck, { nullable: true })
  @UseMiddleware(isAuth)
  async startLearning(
    @Arg("id") id: number,
    @Ctx() { req }: MyContext
  ): Promise<Deck | null> {
    try {
      const deck = await getConnection().manager.findOne(Deck, {
        relations: ["learners", "creator"],
        where: { id: id },
      });

      if (!deck) {
        return null;
      }

      const user = await getConnection().manager.findOne(User, {
        where: { id: req.user },
      });
      deck!.learners.push(user!);

      await deck!.save();

      return deck;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  @Query(() => [Deck], { nullable: true })
  @UseMiddleware(isAuth)
  async deckSearch(
    @Arg("title") title: string,
    @Ctx() { req }: MyContext
  ): Promise<Deck[] | null> {
    try {
      const decks = await getConnection()
        .getRepository(Deck)
        .createQueryBuilder("deck")
        .leftJoinAndSelect("deck.learners", "learners")
        .leftJoinAndSelect("deck.cards", "cards")
        .leftJoin("deck.creator", "creator")
        .where("LOWER(deck.title) like :dTitle", {
          dTitle: `%${title.toLowerCase()}%`,
        })
        .orWhere("LOWER(deck.description) like :dTitle", {
          dTitle: `%${title.toLowerCase()}%`,
        })
        .andWhere("creator.id != :id", { id: req.user })
        .orderBy("cards.order", "ASC")
        .select(["deck", "cards", "learners.username", "creator.username"])
        .getMany();
      return decks;
    } catch (er) {
      return null;
    }
  }

  @Query(() => [Deck], { nullable: true })
  @UseMiddleware(isAuth)
  async discover(@Ctx() { req }: MyContext): Promise<Deck[] | null> {
    try {
      const order = await getConnection().query(
        `SELECT deck."id", COUNT("user"."id") FROM "deck" JOIN "deck_learners_user" ON "deck_learners_user"."deckId" = "deck"."id" JOIN "user" ON "user"."id" = "deck_learners_user"."userId" GROUP BY "deck"."id" ORDER BY "count" DESC`
      );
      const ids = order.map((i: any) => i.id);
      const decks = await Deck.find({
        where: { id: In(ids) },
        relations: ["creator", "learners", "cards"],
      });
      return decks;
    } catch (err) {
      return null;
    }
  }
}
