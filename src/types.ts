import { Request, Response } from "express";
import { RedisClient } from "redis";

export type MyContext = {
  req: Request;
  res: Response;
  redis: RedisClient;
};

declare module "express-session" {
  export interface SessionData {
    userId: number;
  }
}
