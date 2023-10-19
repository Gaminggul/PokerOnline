import { prisma } from "../server/db";
import { MPLobby } from "./classes/mp_lobby";

export async function disconnect_user(user_id: string) {
    console.log("Disconnecting user", user_id);
    const user = await prisma.user.findUnique({
        where: {
            id: user_id,
        },
        include: {
            lobby: {
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
                    users: true,
                },
            },
        },
    });
    if (!user) {
        console.log("User not found");
        return;
    }
    const lobby = user.lobby;
    if (!lobby) {
        console.log("User not in a lobby");
        return;
    }
    const mplobby = new MPLobby(lobby);
    mplobby.remove_user(user_id);
    await mplobby.distribute();
}
