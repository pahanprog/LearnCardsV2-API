import { Deck } from "../entities/Deck";
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
import { Brackets, getConnection, Like, QueryBuilder } from "typeorm";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { Card } from "../entities/Card";
import { User } from "../entities/User";

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
  number!: number;

  @Field({ nullable: true })
  id?: number;
}

@Resolver()
export class DeckResolver {
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
        .orderBy("cards.number", "ASC")
        .where("deck.creatorId = :id", { id: req.session.userId })
        .orWhere("learners.id = :id", { id: req.session.userId })
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
      .orderBy("cards.number", "ASC")
      .where("deck.id = :deckid", { deckid: deckId })
      .andWhere(
        new Brackets((qb) => {
          qb.where("deck.creatorId = :crId", {
            crId: req.session.userId,
          }).orWhere("learners.id = :lrId", { lrId: req.session.userId });
        })
      )
      .getOne();
    return deck;
  }

  @Mutation(() => Deck, { nullable: true })
  @UseMiddleware(isAuth)
  async createDeck(
    @Arg("input") input: DeckInput,
    @Ctx() { req }: MyContext
  ): Promise<Deck | null> {
    const user = await User.findOne({ where: { id: req.session.userId } });

    const deck = Deck.create({
      title: input.title,
      description: input.description,
      creatorId: req.session!.userId,
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
      where: { id: id, creatorId: req.session.userId },
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
      where: { id: deckId, creatorId: req.session.userId },
    });

    if (!check) {
      return undefined;
    }

    await update.forEach(async (value) => {
      if (value.id) {
        try {
          const card = await Card.findOne({
            where: { id: value.id, parentId: deckId },
          });
          card!.answer = value.answer;
          card!.question = value.question;
          getConnection().manager.save(card);
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          await Card.create({
            answer: value.answer,
            question: value.question,
            parentId: deckId,
            number: value.number,
          }).save();
        } catch (err) {
          console.error(err);
        }
      }
    });
    if (del) {
      await del.forEach(async (value) => {
        await getConnection().manager.delete(Card, { id: value.id });
      });
    }
    const deck = getConnection().manager.findOne(Deck, {
      relations: ["cards"],
      where: { id: deckId, creatorId: req.session.userId },
    });
    return deck;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteDeck(
    @Arg("id") id: number,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    try {
      const deck = await getConnection().manager.findOne(Deck, {
        where: { id: id, creatorId: req.session.userId },
      });
      await getConnection().manager.remove(deck);
    } catch (e) {
      console.log(e);
      return false;
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
        relations: ["learners"],
        where: { id: id },
      });

      if (!deck) {
        return null;
      }

      const user = await getConnection().manager.findOne(User, {
        where: { id: req.session.userId },
      });
      deck!.learners.push(user!);

      await deck!.save();

      return deck;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async stopLearning(
    @Arg("id") id: number,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    try {
      const deck = await getConnection().manager.findOne(Deck, {
        relations: ["learners"],
        where: { id: id },
      });

      if (!deck) {
        return false;
      }

      const filtered = deck!.learners.filter((el) => {
        return el.id != req.session.userId;
      });
      deck!.learners = filtered;

      await deck!.save();

      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  @Query(() => [Deck], { nullable: true })
  @UseMiddleware(isAuth)
  async deckSearch(@Arg("title") title: string): Promise<Deck[] | null> {
    try {
      const decks = await getConnection()
        .getRepository(Deck)
        .createQueryBuilder("deck")
        .leftJoinAndSelect("deck.learners", "learners")
        .leftJoinAndSelect("deck.cards", "cards")
        .leftJoin("deck.creator", "creator")
        .where("deck.title like :dTitle", { dTitle: `%${title}%` })
        .orderBy("cards.number", "ASC")
        .select(["deck", "cards", "learners.username", "creator.username"])
        .getMany();
      return decks;
    } catch (er) {
      return null;
    }
  }
}
