import { z } from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const gameRouter = createTRPCRouter({
    getChannelId: protectedProcedure
        .input(z.object({ tableId: z.string() }))
        .query(({ input }) => {
            return {
                channelId: "123",
            }
        }),

    getSecretMessage: protectedProcedure.query(() => {
        return "you can now see this secret message!";
    }),
});
