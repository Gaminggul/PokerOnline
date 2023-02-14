import { z } from "zod";
import { TableStateActionSchema } from "../../../scripts/table_state";
import { prisma } from "../../db";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const gameRouter = createTRPCRouter({
    getChannelId: protectedProcedure
        .input(z.object({ tableId: z.string() }))
        .query(({ input }) => {
            return {
                channelId: "123",
            }
        }),

    submitGameAction: protectedProcedure
        .input(TableStateActionSchema)
        .query(({ input, ctx }) => {
            const user = ctx.session.user;
            if (input.type == "fold") {
                prisma.player.update({
                    where: {
                        id: 
                    }
                })
            }
        }) 
});
