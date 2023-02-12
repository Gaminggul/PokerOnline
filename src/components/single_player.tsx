import { useImmer } from "use-immer";
import type {
    PlayerState,
    TableState,
    TableStateAction,
    VisualPlayerState,
    VisualTableState,
} from "../scripts/table_state";
import { error, range } from "functional-utilities";
import Table from "./table";
import { create_deck } from "../scripts/create_deck";
import { type CardId } from "../scripts/cards";

function generate_game(player_amount: number, table_id: string): TableState {
    const deck = create_deck();
    if (player_amount > 10) {
        throw new Error("Too many players");
    }

    const players = range(player_amount).map((i) => {
        return {
            name: `Player ${i + 1}`,
            bet: 0,
            //hand: ["clubs_3", "clubs_4"],
            hand: deck.splice(0, 2),
            remainingChips: 100,
            folded: false,
        } satisfies PlayerState;
    });

    const centerCards: CardId[] = deck.splice(0, 5);
    // [
    //     "clubs_5",
    //     "clubs_6",
    //     "clubs_7",
    //     "spades_7",
    //     "spades_9",
    // ];

    return {
        players,
        centerCards,
        pot: 0,
        centerRevealAmount: 3,
        currentBet: 0,
        currentPlayerIndex: 0,
        requireBetRound: false,
        revealed: false,
        deck,
        tableId: table_id,
    };
}

const player_amount = 3;

function SinglePlayer(props: { tableId: string }) {
    const [tableState, setTableState] = useImmer<TableState>(
        generate_game(player_amount, props.tableId)
    );
    const min_bet = tableState.players.reduce((min, player) => {
        if (player.bet > min) {
            return player.bet;
        } else {
            return min;
        }
    }, 0);
    const next_center = () => {
        console.log("next center");
        setTableState((draft) => {
            draft.centerRevealAmount++;
            if (draft.centerRevealAmount === 6) {
                draft.centerRevealAmount = 5;
                draft.revealed = true;
                setTimeout(() => {
                    setTableState(() =>
                        generate_game(player_amount, props.tableId)
                    );
                }, 5000);
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
        const turn = index === tableState.currentPlayerIndex;
        return {
            ...player,
            you: turn, // Because it's single player, you are always the current player
            turn,
            hand: player.folded
                ? "folded"
                : player.hand.map((card) => (turn ? card : "hidden")),
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
            pot: tableState.pot,
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
