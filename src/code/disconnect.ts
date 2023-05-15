import { prisma } from "../server/db";
import { MPGameState } from "./classes/mp_game_state";

export async function disconnect_user(user_id: string) {
    console.log("Disconnecting user", user_id);
    const user = await prisma.user.findUnique({
        where: {
            id: user_id,
        },
        include: {
            player: {
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
                    user: true,
                },
            },
        },
    });
    if (!user) {
        console.log("User not found");
        return;
    }
    const player = user.player;
    if (!player) {
        console.log("Player not found");
        return;
    }
    const game = MPGameState.from_prisma_data(player.game);
    game.instance = game.instance.force_action({ type: "fold" }, player.id);
    await game.distribute();
}
