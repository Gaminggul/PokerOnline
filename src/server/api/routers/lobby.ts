import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "../../db";
import { Lobby } from "@prisma/client";
import { create_pusher_server } from "../../pusher";
import { v4 } from "uuid";

function distributeLobbyUpdate(lobby: Lobby & { users: { id: string }[] }) {
    const pusher = create_pusher_server();
    pusher.trigger(lobby.channel, "update", lobby);
}

export const lobbyRouter = createTRPCRouter({
    joinPublicGame: protectedProcedure
        .input(z.object({ size: z.union([z.number(), z.undefined()]) }))
        .mutation(async ({ ctx }) => {
            const user = ctx.session.user;
            const lobby = await prisma.$transaction(async (tx) => {
                const lobby = (
                    await tx.lobby.findMany({
                        where: {
                            access: "public",
                        },
                        orderBy: {
                            users: {
                                _count: "asc",
                            },
                        },
                        include: {
                            users: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                        take: 1,
                    })
                )[0];

                if (!lobby || lobby.users.length >= lobby.size) {
                    return (await tx.lobby.create({
                        data: {
                            size: 10,
                            access: "public",
                            users: {
                                connect: {
                                    id: user.id,
                                },
                            },
                            channel: v4(),
                        },
                    })) as Lobby & { users: { id: string }[] };
                }

                return lobby;
            });
            distributeLobbyUpdate(lobby);
            return lobby;
        }),
});
