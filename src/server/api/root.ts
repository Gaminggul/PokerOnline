import { createTRPCRouter } from "./trpc";
import { exampleRouter } from "./routers/example";
import { gameRouter } from "./routers/game";
import { lobbyRouter } from "./routers/lobby";
import { userRouter } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
    example: exampleRouter,
    game: gameRouter,
    lobby: lobbyRouter,
    user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
