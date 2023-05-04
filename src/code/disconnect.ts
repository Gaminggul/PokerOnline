import { panic } from "functional-utilities";
import { prisma } from "../server/db";
import { distribute_new_state } from "./mp_visual_game_state";

export async function disconnect_user(user_id: string) {
    console.log("Disconnecting user", user_id);
    const player =
        (await prisma.player.update({
            where: {
                id: user_id,
            },
            data: {
                folded: true,
            },
            include: {
                game: {
                    include: {
                        players: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        })) ?? panic("Player not found");
    const game = player.game;
    await distribute_new_state(game);
}
