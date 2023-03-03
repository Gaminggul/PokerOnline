import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../../utils/api";
import { Layout } from "../../../../components/layout";
import { subscribe, unsubscribe } from "../../../../scripts/pusher";
import { Lobby } from "@prisma/client";
import { Timer } from "../../../../components/timer";
import {
    type VisualGameState,
    VisualGameStateSchema,
} from "../../../../scripts/game_data";
import Table from "../../../../components/table";

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
    const joiningRef = useRef(false);

    useEffect(() => {
        if (lobby?.channel) {
            const channel = subscribe(lobby.channel);
            channel.bind("update", (newData: LobbyType) => {
                console.log("Lobby updated", newData);
                setLobby(newData);
            });
            return () => {
                channel.unbind_all();
                unsubscribe(lobby.channel);
            };
        }
    }, [lobby?.channel]);

    const joinLobby = api.lobby.joinLobby.useMutation();

    useEffect(() => {
        if (access === "public" && !joiningRef.current) {
            console.log("Joining lobby");
            joiningRef.current = true;
            joinLobby.mutate(
                { size, access },
                {
                    onSettled: (data) => {
                        if (!data) {
                            console.log("Failed to join lobby");
                            router.push("/");
                            return;
                        }
                        console.log(`Joined lobby ${data.access}`, data);
                        setLobby(data);
                    },
                }
            );
        }
    }, [access, size, joinLobby]);

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
            <p>{lobby.started}</p>
            {lobby.started ? <MultiPlayer /> : <LobbyWaitPage lobby={lobby} />}
        </div>
    );
}

function LobbyWaitPage({ lobby }: { lobby: LobbyType }) {
    const requestGameStart = api.lobby.requestGameStart.useMutation();
    return (
        <div>
            <div>
                <h1>Lobby</h1>
                <p>Access: {lobby.access}</p>
                <p>Size: {lobby.size}</p>
                {lobby.users.map((user) => (
                    <p key={user.id}>{JSON.stringify(user)}</p>
                ))}

                {lobby.startAt && (
                    <p>
                        Round starts in{" "}
                        <Timer
                            end_time={lobby.startAt}
                            on_end={() => {
                                requestGameStart.mutate();
                            }}
                        ></Timer>
                    </p>
                )}
            </div>

            <div>
                <p>All:</p>
                <pre>{JSON.stringify(lobby, null, 4)}</pre>
            </div>
        </div>
    );
}

function MultiPlayer() {
    const [visualGameState, setVisualGameState] = useState<
        VisualGameState | undefined
    >(undefined);
    const channelIdQuery = api.game.getChannelId.useQuery();
    const visualGameStateQuery = api.game.getVisualGameState.useQuery();
    const submitActionQuery = api.game.submitGameAction.useMutation();

    useEffect(() => {
        if (!channelIdQuery.data) {
            return;
        }
        const channelId = channelIdQuery.data.channel;
        const channel = subscribe(channelId);

        channel.bind("update", (newData: unknown) => {
            const newVisualTableState =
                VisualGameStateSchema.safeParse(newData);
            if (newVisualTableState.success) {
                setVisualGameState(newVisualTableState.data);
            } else {
                console.error("Invalid data received from server");
                console.error(newVisualTableState.error);
            }
        });

        return () => {
            channel.unbind_all();
            unsubscribe(channelId);
        };
    }, [channelIdQuery.data]);

    useEffect(() => {
        if (!visualGameStateQuery.data) {
            return;
        }
        setVisualGameState(visualGameStateQuery.data);
    }, [visualGameStateQuery.data]);

    return (
        <div>
            {visualGameState ? (
                <Table
                    state={visualGameState}
                    submit_action={submitActionQuery.mutate}
                />
            ) : (
                <div>Loading...</div>
            )}
        </div>
    );
}

export default Lobby;
