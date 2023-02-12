import { useImmer } from "use-immer";
import type {
    PlayerState,
    TableState,
    TableStateAction,
    VisualPlayerState,
    VisualTableState,
} from "../scripts/table_state";
import { error } from "functional-utilities";
import Table from "./table";
import { create_deck } from "../scripts/create_deck";
import { get_combination, type CardId } from "../scripts/cards";
import { max } from "lodash-es";

interface PlayerData {
    name: string;
    remainingChips: number;
}

function generate_game(
    player_data: PlayerData[],
    table_id: string
): TableState {
    const deck = create_deck();
    if (player_data.length > 10) {
        throw new Error("Too many players");
    }

    const players = player_data.map((player) => {
        return {
            name: player.name,
            bet: 0,
            //hand: ["spades_10", "hearts_9"],
            hand: deck.splice(0, 2),
            folded: false,
        } satisfies PlayerState;
    });

    const centerCards: CardId[] = deck.splice(0, 5);
    // [
    //     "diamonds_queen",
    //     "clubs_king",
    //     "spades_jack",
    //     "spades_5",
    //     "clubs_queen",
    // ];

    return {
        players,
        centerCards,
        centerRevealAmount: 3,
        currentBet: 0,
        currentPlayerIndex: 0,
        requireBetRound: false,
        revealed: false,
        deck,
        tableId: table_id,
    };
}

function get_winners(state: TableState): PlayerState[] | undefined {
    // winners are the players with the same highest score
    // There will only be one winner most of the time
    const possible_winners = state.players.filter((player) => !player.folded);
    const win_score =
        max(
            possible_winners.map((player) => {
                const combination = get_combination(
                    player.hand.concat(state.centerCards)
                );
                return combination.type === "none"
                    ? 0
                    : combination.base_score * 100 + combination.score;
            })
        ) ?? 0;
    const winners = possible_winners.filter((player) => {
        const combination = get_combination(
            player.hand.concat(state.centerCards)
        );
        return (
            combination.type !== "none" &&
            combination.base_score * 100 + combination.score === win_score
        );
    });
    if (winners.length === 0) {
        return undefined;
    } else {
        return winners;
    }
}

function SinglePlayer(props: { tableId: string }) {
    const [player_data, setPlayerData] = useImmer<PlayerData[]>([
        { name: "Player 1", remainingChips: 100 },
        { name: "Player 2", remainingChips: 100 },
        { name: "Player 3", remainingChips: 100 },
    ]);
    const [tableState, setTableState] = useImmer<TableState>(
        generate_game(player_data, props.tableId)
    );
    const min_bet =
        max([
            tableState.players.reduce((min, player) => {
                if (player.bet > min) {
                    return player.bet;
                } else {
                    return min;
                }
            }, 1),
            1,
        ]) ?? error("Min bet is undefined");
    const end_of_round = () => {
        setTableState((draft) => {
            draft.centerRevealAmount = 5;
            draft.revealed = true;
            setTimeout(() => {
                setTableState(() => generate_game(player_data, props.tableId));
            }, 5000);
        });
        setPlayerData((player_draft) => {
            const winners = get_winners(tableState);
            const player_map = player_draft.reduce((map, player) => {
                map[player.name] = player;
                return map;
            }, {} as Record<string, PlayerData>);
            if (winners) {
                // take away the bet from the players
                tableState.players.forEach((player) => {
                    const player_data = player_map[player.name];
                    if (player_data) {
                        player_data.remainingChips -= player.bet;
                    }
                });
                // give the pot to the winners
                const pot = tableState.players.reduce(
                    (sum, player) => sum + player.bet,
                    0
                );
                const winner_pot = pot / winners.length;
                winners.forEach((winner) => {
                    const player = player_draft.find(
                        (player) => player.name === winner.name
                    );
                    if (player) {
                        player.remainingChips += winner_pot;
                    }
                });
            }
        });
    };

    const next_center = () => {
        console.log("next center");
        setTableState((draft) => {
            draft.centerRevealAmount++;
            if (draft.centerRevealAmount === 6) {
                draft.centerRevealAmount = 5;
                end_of_round();
            }
        });
    };
    const next_player = () => {
        setTableState((draft) => {
            if (draft.requireBetRound) {
                draft.currentPlayerIndex =
                    (draft.currentPlayerIndex + 1) % draft.players.length;
                if (draft.currentPlayerIndex === 0) {
                    draft.requireBetRound = false;
                }
            } else {
                draft.currentPlayerIndex =
                    (draft.currentPlayerIndex + 1) % draft.players.length;
                if (draft.currentPlayerIndex === 0) {
                    next_center();
                }
            }
        });
    };
    function action_handler(action: TableStateAction) {
        setTableState((draft) => {
            if (action.type === "bet") {
                (
                    draft.players[draft.currentPlayerIndex] ??
                    error("Current player is undefined")
                ).bet = action.bet;
                if (draft.currentPlayerIndex !== 0 && action.bet > min_bet) {
                    draft.requireBetRound = true;
                }
            } else if (action.type === "fold") {
                (
                    draft.players[draft.currentPlayerIndex] ??
                    error("Current player is undefined")
                ).folded = true;
            }
        });
        next_player();
    }
    function create_visual_player_state(
        player: TableState["players"][number],
        index: number
    ): VisualPlayerState {
        const you = index === tableState.currentPlayerIndex;
        return {
            ...player,
            you,
            turn: you && !tableState.revealed, // Because it's single player, you are always the current player
            remainingChips: (
                player_data.find((p) => p.name === player.name) ??
                error("Player data not found")
            ).remainingChips,
            hand: player.folded
                ? "folded"
                : player.hand.map((card) => (you ? card : "hidden")),
        };
    }
    function create_visual_table_state(
        tableState: TableState
    ): VisualTableState {
        const table = {
            centerCards: tableState.centerCards.map((card, i) =>
                i < tableState.centerRevealAmount ? card : "hidden"
            ),
            players: tableState.players.map(create_visual_player_state),
            tableId: tableState.tableId,
        } satisfies VisualTableState;
        return table;
    }

    return (
        <div className="flex w-full">
            <Table
                submit_action={action_handler}
                state={create_visual_table_state(tableState)}
            />
            <div className="w-[300px] text-xs">
                <p>State</p>
                <pre>{JSON.stringify(tableState, null, 2)}</pre>
            </div>
        </div>
    );
}

export default SinglePlayer;
