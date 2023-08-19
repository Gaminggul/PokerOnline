import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { prisma } from "../../../db";
import { player_max_amount } from "../../../../code/constants";
import { v4 } from "uuid";
import { MPLobby } from "../../../../code/classes/mp_lobby";
import { Prisma } from "@prisma/client";
import { User } from "next-auth";
import { lobby_ready } from "./ready";
import dayjs from "dayjs";

async function handleCreatePrivate(user: User) {
    const privateLobby = await prisma.lobby.create({
        data: {
            size: player_max_amount,
            access: "private",
            ownerId: user.id,
            users: {
                connect: {
                    id: user.id,
                },
            },
            channel: `lobby-${v4()}`,
            blindIndex: 0,
        },
        include: {
            users: true,
        },
    });

    return new MPLobby({
        ...privateLobby,
        game: undefined,
    }).visualize();
}

async function handleJoinById(
    tx: Prisma.TransactionClient,
    user: User,
    id: string,
) {
    const existingLobby = await tx.lobby.findUnique({
        where: { id },
        include: { users: true },
    });

    if (!existingLobby) {
        throw new Error("Lobby with provided ID not found.");
    }

    await tx.lobby.update({
        where: { id: existingLobby.id },
        data: {
            users: {
                connect: { id: user.id },
            },
            startAt:
                existingLobby.access === "public"
                    ? lobby_ready(existingLobby, existingLobby.users.length + 1)
                        ? dayjs().add(10, "second").toDate()
                        : undefined
                    : undefined,
        },
        include: { users: true },
    });

    return existingLobby;
}

async function handleJoinPublic(tx: Prisma.TransactionClient, user: User) {
    const publicLobby = (
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
                users: true,
            },
            take: 1,
        })
    )[0];

    if (!publicLobby || publicLobby.users.length >= publicLobby.size) {
        return await tx.lobby.create({
            data: {
                size: player_max_amount,
                access: "public",
                users: {
                    connect: {
                        id: user.id,
                    },
                },
                channel: `lobby-${v4()}`,
                blindIndex: 0,
            },
            include: {
                users: true,
            },
        });
    } else {
        return await tx.lobby.update({
            where: {
                id: publicLobby.id,
            },
            data: {
                users: {
                    connect: {
                        id: user.id,
                    },
                },
                startAt: lobby_ready(publicLobby, publicLobby.users.length + 1)
                    ? dayjs().add(10, "second").toDate()
                    : undefined,
            },
            include: {
                users: true,
            },
        });
    }
}

export const lobbyAction = protectedProcedure
    .input(
        z.union([
            z.object({
                action: z.literal("join_public"),
                size: z.number(),
            }),
            z.object({
                action: z.literal("join_id"),
                id: z.string(),
            }),
            z.object({
                action: z.literal("create_private"),
            }),
        ]),
    )
    .mutation(async ({ ctx, input }) => {
        const user = ctx.session.user;

        if (input.action === "create_private") {
            return handleCreatePrivate(user);
        }

        const joinedLobby = await prisma.$transaction(async (tx) => {
            if (input.action === "join_id") {
                return await handleJoinById(tx, user, input.id);
            } else {
                return await handleJoinPublic(tx, user);
            }
        });

        const mp_lobby = new MPLobby({
            ...joinedLobby,
            game: undefined,
        });

        if (joinedLobby.users.length > 1) {
            await mp_lobby.distribute();
        }

        return mp_lobby.visualize();
    });
