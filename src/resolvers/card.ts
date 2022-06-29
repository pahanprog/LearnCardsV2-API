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
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Brackets, getConnection } from "typeorm";
import { castArray } from "lodash";
import { CardStats } from "../entities/CardStats";
import { clamp } from "../utils/clamp";
import { userInfo } from "os";
import { shuffle } from "../utils/shuffle";
import { Session } from "../entities/Session";

const cardComparisonFunction = (a: Card, b: Card) => {
  if (a.stats[0].daysBetweenReviews > b.stats[0].daysBetweenReviews) return 1;
  if (a.stats[0].daysBetweenReviews < b.stats[0].daysBetweenReviews) return -1;
  return 0;
};

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
      relations: ["deck", "deck.creator"],
      where: { id: input.id },
    });

    if (!card) {
      return undefined;
    }

    if (!card.deck.creator.id === req.user) {
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

  @Mutation(() => CardStats, { nullable: true })
  @UseMiddleware(isAuth)
  async calculateStats(
    @Arg("performanceRating") performanceRating: number,
    @Arg("sessionId") sessionId: number,
    @Arg("id") id: number,
    @Ctx() { req }: MyContext
  ): Promise<CardStats | null> {
    const session = await Session.findOne(sessionId);
    if (!session) {
      return null;
    }
    const card = await getConnection()
      .getRepository(Card)
      .createQueryBuilder("card")
      .leftJoinAndSelect("card.deck", "deck")
      .leftJoinAndSelect("card.stats", "cStats", "cStats.userId = :userId", {
        userId: req.user,
      })
      .leftJoinAndSelect("deck.creator", "creator")
      .leftJoinAndSelect("deck.learners", "learners")
      .where("card.id = :cardId", { cardId: id })
      .andWhere(
        new Brackets((qb) => {
          qb.where("creator.id = :crId", {
            crId: req.user,
          }).orWhere("learners.id = :lrId", { lrId: req.user });
        })
      )
      .getOne();

    if (!card) {
      return null;
    }

    const now = new Date();
    // const tomorrow = new Date(now.setDate(now.getDate() + 1));
    // console.log(tomorrow);

    let saved: CardStats | null = null;

    if (card.stats[0]) {
      const percentOverdue =
        performanceRating >= 0.6
          ? Math.min(
              2,
              Math.ceil(
                now.getTime() -
                  card.stats[0].dateLastReviewed.getTime() / (1000 * 3600 * 24)
              ) / card.stats[0].daysBetweenReviews
            )
          : 1;
      card.stats[0].difficulty = clamp(
        card.stats[0].difficulty +
          percentOverdue * ((1 / 17) * (8 - 9 * performanceRating)),
        0,
        1
      );
      const difficultyWeight = 3 - 1.7 * card.stats[0].difficulty;
      card.stats[0].daysBetweenReviews =
        card.stats[0].daysBetweenReviews *
        (performanceRating >= 0.6
          ? 1 +
            (difficultyWeight - 1) *
              percentOverdue *
              Math.random() *
              (1.05 - 0.95) +
            0.95
          : Math.min(1 / (1 + 3 * card.stats[0].difficulty), 1));
      card.stats[0].dateLastReviewed = now;
      card.stats[0].lastPerformanceRating = performanceRating;
      saved = await card.stats[0].save();
    } else {
      const percentOverdue = performanceRating >= 0.6 ? 2 : 1;
      const difficulty = clamp(
        0.3 + ((percentOverdue * 1) / 17) * (8 - 9 * performanceRating),
        0,
        1
      );
      const difficultyWeight = 3 - 1.7 * difficulty;
      const daysBetweenReviews =
        performanceRating >= 0.6
          ? 1 +
            (difficultyWeight - 1) *
              percentOverdue *
              Math.random() *
              (1.05 - 0.95) +
            0.95
          : Math.min(1 / (1 + 3 * difficulty), 1);
      saved = await CardStats.create({
        difficulty,
        daysBetweenReviews,
        dateLastReviewed: now,
        lastPerformanceRating: performanceRating,
        card: card,
        user: req.user,
      }).save();
    }
    session.finishedCards = session.finishedCards + 1;
    session.save();

    return saved;
  }

  @Mutation(() => Session, { nullable: true })
  @UseMiddleware(isAuth)
  async startLearningSession(
    @Arg("deckId") deckId: number,
    @Ctx() { req }: MyContext
  ): Promise<Session | null> {
    const deck = await getConnection()
      .getRepository(Deck)
      .createQueryBuilder("deck")
      .leftJoinAndSelect(
        "deck.sessions",
        "sessions",
        "sessions.userId = :userId",
        { userId: req.user }
      )
      .where("deck.id = :deckId", { deckId })
      .getOne();

    console.log(deck);

    if (!deck) {
      return null;
    }

    let final: Array<Card> = [];

    const cards = await getConnection()
      .getRepository(Card)
      .createQueryBuilder("card")
      .leftJoinAndSelect("card.stats", "stats", "stats.userId = :userId", {
        userId: req.user,
      })
      .where("card.deckId = :deckId", { deckId })
      .orderBy("card.order")
      .getMany();

    if (cards.length === 0) {
      return null;
    }

    console.log(cards);

    if (deck.sessions.length === 0) {
      console.log("FIRST SESSION");
      final = shuffle(cards);
      final = final.splice(0, 10);
      if (final.length < 10) {
        console.log("TO SMALL ", final.length);
        let flag = true;
        while (flag) {
          console.log("ADDING ITEM");
          final.push(final[Math.floor(Math.random() * final.length)]);
          if (final.length === 10) {
            flag = false;
          }
        }
      }
    } else {
      console.log("Should calculate overdue");
      const noStats = cards.filter((i) => {
        if (!i.stats[0]) {
          return i;
        }
      });
      const haveStats = cards.filter((i) => {
        if (i.stats[0]) {
          return i;
        }
      });
      console.log(
        "Initial ",
        cards.length,
        "\nhave no stats ",
        noStats.length,
        "\nhave stats ",
        haveStats.length
      );

      haveStats.sort(cardComparisonFunction);
      console.log("SORTED WITH STATS ", haveStats);

      if (noStats.length < 10 && haveStats.length > 0) {
        console.log("FIRST FLAG");
        final = noStats;
        let i = 0;
        console.log("FINAL LENGHT ", final.length);
        let flag = true;
        while (flag) {
          console.log("FINAL LENGHT ", final.length, " I ", i);
          final.push(haveStats[i]);
          i++;
          if (i === haveStats.length || final.length === 10) {
            flag = false;
          }
        }
        console.log("FINAL LENGHT AFTER WHILE ", final.length);
        if (final.length < 10) {
          console.log("TO SMALL ", final.length);
          let flag = true;
          while (flag) {
            console.log("ADDING ITEM");
            final.push(final[Math.floor(Math.random() * final.length)]);
            if (final.length === 10) {
              flag = false;
            }
          }
        }
      } else if (noStats.length >= 10) {
        console.log("SECOND FLAG");
        final = noStats.slice(0, 10);
      } else {
        final = shuffle(cards);
        final = final.splice(0, 10);
        if (final.length < 10) {
          console.log("TO SMALL ", final.length);
          let flag = true;
          while (flag) {
            console.log("ADDING ITEM");
            final.push(final[Math.floor(Math.random() * final.length)]);
            if (final.length === 10) {
              flag = false;
            }
          }
        }
        console.log("WHAT TO DO NOW");
      }
    }

    final = shuffle(final);
    console.log("FINAL ARRAY \n");
    console.log("LENGHT ", final.length, "\n");
    final.forEach((i) => {
      console.log("Item ", i);
    });

    const session = await Session.create({
      cards: final,
      deck: deck,
      user: req.user,
    }).save();

    session.cards = final;
    session.cardsNumber = session.cards.length;

    return session;
  }

  @Query(() => Card, { nullable: true })
  @UseMiddleware(isAuth)
  async getCardFromSession(
    @Arg("sessionId") sessionId: number,
    @Arg("cardId") cardId: number,
    @Ctx() { req }: MyContext
  ): Promise<Card | null> {
    // const session = await Session.findOne(sessionId);

    const session = await getConnection()
      .getRepository(Session)
      .createQueryBuilder("session")
      .leftJoinAndSelect("session.cards", "cards", "cards.id = :cardId", {
        cardId,
      })
      .leftJoinAndSelect("cards.stats", "stats", "stats.userId = :userId", {
        userId: req.user,
      })
      .where('"session"."id" = :sessionId', { sessionId })
      .getOne();

    if (!session || !session.cards[0]) {
      return null;
    }

    return session.cards[0];
  }
}
