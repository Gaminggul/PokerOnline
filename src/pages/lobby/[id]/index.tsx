import { useRouter } from "next/router";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { api } from "../../../utils/api";
import { Layout } from "../../../components/layout";
import { subscribe, unsubscribe, useChannel } from "../../../code/pusher";
import { Timer } from "../../../components/timer";
import {
    type VisualGameState,
    VisualGameStateSchema,
    type VisualLobbyState,
    VisualLobbyStateSchema,
} from "../../../code/game_data";
import { Table } from "../../../components/table";
import { player_start_amount } from "../../../code/constants";
import { useSession } from "next-auth/react";
import { createJsonSchema } from "../../../utils/json_util";
import { maybe_global } from "functional-utilities";
import WarnClose from "../../../components/warnclose";
import { TableOld } from "../../../components/table_old";
import { Avatar, Button, Spinner } from "@nextui-org/react";
import { IoCaretForward } from "react-icons/io5";
type Comparator<T> = (prev: T, next: T) => boolean;

function useConditionalMemo<T>(
    getValue: () => T,
    shouldUpdate: Comparator<T> = (prev, next) => prev !== next,
): T {
    const [value, setValue] = useState<T>(getValue());
    const prevValue = useRef<T>(value);

    useEffect(() => {
        const newValue = getValue();
        if (shouldUpdate(prevValue.current, newValue)) {
            setValue(newValue);
            prevValue.current = newValue;
        }
    }, [getValue, shouldUpdate]);

    return value;
}
7;

function Lobby() {
    const router = useRouter();
    const id = router.query.id as string;

    const [lobby, setLobby] = useState<VisualLobbyState | null>(null);
    const joiningRef = useRef(false);
    const joinAction = api.lobby.lobbyAction.useMutation();
    const lobbyQuery = api.lobby.getLobby.useQuery(undefined, { cacheTime: 0 });
    const pongMutation = api.lobby.pong.useMutation();

    const [warnOnNavigation, setWarnOnNavigation] = useState(false);

    const channel_name = useConditionalMemo(
        () => lobby?.channel,
        (prev, next) => {
            return prev !== next;
        },
    );

    const { data: session } = useSession({ required: true });
    const channel = useChannel(channel_name);

    useEffect(() => {
        if (channel) {
            channel.unbind("update");
            channel.bind("update", (newData: unknown) => {
                setLobby(
                    createJsonSchema(VisualLobbyStateSchema).parse(newData),
                );
                console.log("Lobby updated", newData);
            });
        }
    }, [channel]);

    useEffect(() => {
        setWarnOnNavigation(!!lobby);
    }, [lobby]);

    useEffect(() => {
        if (channel) {
            channel.unbind("ping");
            channel.bind("ping", (id: string) => {
                if (id !== session?.user?.id) {
                    return;
                }
                console.log("Pong");
                pongMutation.mutate();
            });
        }
    }, [channel, session?.user?.id, pongMutation]);

    useEffect(() => {
        let schedule_update = false;

        if (!joiningRef.current && id) {
            console.log("Joining lobby");
            joiningRef.current = true;
            schedule_update = true;

            joinAction.mutate(
                id === "join"
                    ? { action: "join_public", size: 10 }
                    : id === "create"
                    ? { action: "create_private" }
                    : { action: "join_id", id },
                {
                    onSettled: (data) => {
                        schedule_update = false;
                        if (!data) {
                            console.error("Failed to join lobby");
                            void router.push("/");
                            return;
                        } else if (data.id !== id) {
                            console.log("Joined lobby", data);
                            maybe_global("window")?.history.replaceState(
                                null,
                                "",
                                `/lobby/${data.id}`,
                            );
                            return;
                        }
                        console.log(`Joined lobby ${data.id}`, data);
                        setLobby(data);
                    },
                },
            );
        }
        return () => {
            if (schedule_update) {
                setTimeout(() => {
                    void lobbyQuery.refetch();
                }, 1000);
            }
        };
    }, [joinAction, lobbyQuery, router, id]);

    useEffect(() => {
        if (lobbyQuery.data) {
            setLobby(lobbyQuery.data);
        }
    }, [lobbyQuery.data]);

    return (
        <>
            <Layout show_banner={false}>
                {lobby ? (
                    <LobbyPage lobby={lobby} />
                ) : (
                    <div>
                        <h1>Loading...</h1>
                    </div>
                )}
            </Layout>
            {warnOnNavigation && (
                <WarnClose warning="This will disconnect you from the lobby."></WarnClose>
            )}
        </>
    );
}

function LobbyPage({ lobby }: { lobby: VisualLobbyState }) {
    return lobby.game_started ? (
        <MultiPlayer />
    ) : (
        <LobbyWaitPage lobby={lobby} />
    );
}

function LobbyWaitPage({ lobby }: { lobby: VisualLobbyState }) {
    const requestGameStart = api.lobby.requestGameStart.useMutation();
    return (
        <div className="flex h-full flex-col justify-between p-8">
            <p className="text-gray-500">Lobby - {lobby.name ?? lobby.id}</p>
            <div className="flex justify-evenly">
                <div>
                    <LobbySettings></LobbySettings>
                </div>
                <div className="flex flex-col gap-4">
                    <h2 className="text-center text-3xl font-bold">Players</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {lobby.users.map((user) => (
                            <Corners>
                                <div
                                    key={user.id}
                                    className="flex items-center gap-2 p-4"
                                >
                                    <Avatar></Avatar>
                                    {user.id === lobby.ownerId && (
                                        <span className="font-bold text-red-500">
                                            Owner
                                        </span>
                                    )}{" "}
                                    {user.name}
                                </div>
                            </Corners>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-center">
                <Button
                    className="p-12 px-24 text-2xl font-black"
                    color="primary"
                >
                    Start
                    <IoCaretForward size={100}></IoCaretForward>
                </Button>
            </div>
            <div className="flex justify-center bg-slate-200 p-8 text-2xl text-slate-800">
                <div className="flex gap-2">
                    <Spinner color="secondary" />
                    {lobby.game_started ? (
                        <>Game is starting</>
                    ) : lobby.startAt ? (
                        <>
                            Game starts in{" "}
                            <Timer
                                end_time={lobby.startAt}
                                on_end={requestGameStart.mutate}
                            ></Timer>
                        </>
                    ) : (
                        <>
                            Waiting for{" "}
                            <span className="font-bold">
                                {player_start_amount - lobby.users.length}
                            </span>{" "}
                            more players to start
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Corners({ children }: PropsWithChildren<{}>) {
    return (
        <div className="relative">
            <div className="h-full w-full shadow-md">{children}</div>
            <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-gray-400 dark:border-white"></div>
            <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-gray-400 dark:border-white"></div>
            <div className="absolute right-1 top-1 h-2 w-2 border-r-1 border-t-1 border-gray-400 dark:border-white"></div>
            <div className="absolute bottom-1 left-1 h-2 w-2 border-b-1 border-l-1 border-gray-400 dark:border-white"></div>
        </div>
    );
}

function LobbySettings() {
    return (
        <div>
            <h2 className="text-center text-3xl font-bold">Settings</h2>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="start_amount">Starting amount</label>
                    <input
                        type="number"
                        name="start_amount"
                        id="start_amount"
                        defaultValue={player_start_amount}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="start_amount">Starting amount</label>
                    <input
                        type="number"
                        name="start_amount"
                        id="start_amount"
                        defaultValue={player_start_amount}
                    />
                </div>
            </div>
        </div>
    );
}

function MultiPlayer() {
    const router = useRouter();
    const [visualGameState, setVisualGameState] = useState<
        VisualGameState | undefined
    >(undefined);
    const channelIdQuery = api.game.getChannelId.useQuery();
    const visualGameStateQuery = api.game.getVisualGameState.useQuery();
    const submitActionQuery = api.game.submitGameAction.useMutation();
    const requestGameRestart = api.game.requestGameRestart.useMutation();

    useEffect(() => {
        if (!channelIdQuery.data) {
            return;
        }
        const channelId = channelIdQuery.data;
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
        const data = visualGameStateQuery.data;
        if (!data) {
            return;
        } else if (data === "lobby_not_started") {
            console.warn("Lobby not started, might just be desync");
        } else if (data === "not_in_lobby") {
            console.log("Not in lobby, redirecting");
            void router.push("/");
        } else {
            setVisualGameState(data);
        }
    }, [visualGameStateQuery.data, router]);

    return (
        <div className="h-full">
            {visualGameState ? (
                <TableOld
                    state={visualGameState}
                    submit_action={submitActionQuery.mutate}
                    restart_action={requestGameRestart.mutate}
                />
            ) : (
                <div>Loading...</div>
            )}
        </div>
    );
}

export default Lobby;
