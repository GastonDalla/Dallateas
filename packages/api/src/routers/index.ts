import { mergeRouters } from "../index";
import { adminRouter } from "./admin";
import { djRouter } from "./dj";
import { folderRouter } from "./folder";
import { libraryRouter } from "./library";
import { profileRouter } from "./profile";
import { publicRouter } from "./public";
import { vinylRouter } from "./vinyl";

export const appRouter = mergeRouters(
  publicRouter,
  vinylRouter,
  folderRouter,
  libraryRouter,
  profileRouter,
  djRouter,
  adminRouter,
);

export type AppRouter = typeof appRouter;
