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
import { User } from "../entities/User";

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
    console.log("START");
    const user = await User.findOne(req.user, { relations: ["stats"] });
    if (!user) {
      return null;
    }
    console.log("SESSION");
    const session = await Session.findOne(sessionId);
    if (!session) {
      return null;
    }
    console.log("CARD");
    const card = await Card.findOne(id);
    if (!card) {
      return null;
    }
    const stat = await getConnection()
      .getRepository(CardStats)
      .createQueryBuilder("stats")
      .where("stats.userId = :userId", { userId: req.user })
      .andWhere("stats.cardId = :cardId", { cardId: id })
      .getOne();

    console.log("CARD STAT", stat);
    const now = new Date();
    // const tomorrow = new Date(now.setDate(now.getDate() + 1));
    // console.log(tomorrow);

    let saved: CardStats | null = null;

    if (stat) {
      console.log("STATS");
      const percentOverdue =
        performanceRating >= 0.6
          ? Math.min(
              2,
              Math.ceil(
                now.getTime() -
                  stat.dateLastReviewed.getTime() / (1000 * 3600 * 24)
              ) / stat.daysBetweenReviews
            )
          : 1;
      stat.difficulty = clamp(
        stat.difficulty +
          percentOverdue * ((1 / 17) * (8 - 9 * performanceRating)),
        0,
        1
      );
      const difficultyWeight = 3 - 1.7 * stat.difficulty;
      stat.daysBetweenReviews =
        stat.daysBetweenReviews *
        (performanceRating >= 0.6
          ? 1 +
            (difficultyWeight - 1) *
              percentOverdue *
              Math.random() *
              (1.05 - 0.95) +
            0.95
          : Math.min(1 / (1 + 3 * stat.difficulty), 1));
      stat.dateLastReviewed = now;
      stat.lastPerformanceRating = performanceRating;
      saved = await stat.save();
    } else {
      console.log("NO STATS");
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
        user: user,
        card: card,
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
    console.log("SESSION START");
    const user = await User.findOne(req.user, { relations: ["sessions"] });

    if (!user) {
      return null;
    }
    console.log("DECK");
    const deck = await getConnection()
      .getRepository(Deck)
      .createQueryBuilder("deck")
      .leftJoinAndSelect("deck.sessions", "sessions")
      .leftJoinAndSelect("sessions.user", "user", "user.id = :userId", {
        userId: req.user,
      })
      .where("deck.id = :deckId", { deckId })
      .getOne();

    if (!deck) {
      return null;
    }

    console.log("DECK ", deck);

    let final: Array<Card> = [];

    console.log("CARDS");
    const cards = await getConnection()
      .getRepository(Card)
      .createQueryBuilder("card")
      .where("card.deckId = :deckId", { deckId })
      .orderBy("card.order")
      .getMany();

    if (cards.length === 0) {
      return null;
    }

    console.log("CARDS ", cards);

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
      console.log("NOT FIRST SESSION");
      let noStats: Card[] = [];
      let haveStats: Card[] = [];
      let cardsCopy = cards;
      console.log("Should calculate overdue");
      for (const card of cardsCopy) {
        const stats = await CardStats.findOne({
          where: { user: user, card: card },
        });
        console.log("FETCHED STATS FOR CARD ", card, " : ", stats);
        if (stats) {
          card.stats = [stats];
          haveStats.push(card);
        } else {
          noStats.push(card);
        }
      }

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
      // cards: final,
    }).save();
    const newSessionsUser = user.sessions;
    newSessionsUser.push(session);
    const newSessionsDeck = deck.sessions;
    newSessionsDeck.push(session);
    user.sessions = newSessionsUser;
    await user.save();
    deck.sessions = newSessionsDeck;
    await deck.save();

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
      .where('"session"."id" = :sessionId', { sessionId })
      .getOne();

    const card = await Card.findOne(cardId);

    if (!session || !card) {
      return null;
    }

    return card;
  }
}
