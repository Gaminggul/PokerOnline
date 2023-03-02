import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "../../../../utils/api";
import { Layout } from "../../../../components/layout";
import { subscribe, unsubscribe } from "../../../../scripts/pusher";
import { Lobby } from "@prisma/client";

type LobbyType = Lobby & {
    users: {
        id: string;
    }[];
};

function Lobby() {
    const router = useRouter();
    const size = parseInt(router.query.size as string);
    const access = router.query.access as string;

    const [lobby, setLobby] = useState<LobbyType | null>(null);

    useEffect(() => {
        if (lobby?.channel) {
            const channel = subscribe(lobby.channel);
            channel.bind("update", (newData: unknown) => {
                setLobby(newData as LobbyType);
            });
            return () => {
                channel.unbind_all();
                unsubscribe(lobby.channel);
            };
        }
    }, [lobby?.channel]);

    const joinPublicLobby = api.lobby.joinPublicGame.useMutation();

    useEffect(() => {
        if (access === "public") {
            joinPublicLobby.mutate(
                { size },
                {
                    onSuccess: (data) => {
                        setLobby(data);
                    },
                }
            );
        }
    }, [access, size, joinPublicLobby]);

    return (
        <Layout show_banner={false}>
            {lobby ? (
                <LobbyPage lobby={lobby} />
            ) : (
                <div>
                    <h1>Loading...</h1>
                </div>
            )}
        </Layout>
    );
}

function LobbyPage({ lobby }: { lobby: LobbyType }) {
    return (
        <div>
            <h1>Lobby</h1>
            <p>Access: {lobby.access}</p>
            <p>Size: {lobby.size}</p>
            {lobby.users.map((user) => (
                <p key={user.id}>{JSON.stringify(user)}</p>
            ))}
        </div>
    );
}

export default Lobby;
