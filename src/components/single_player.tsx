import { useImmer } from "use-immer";
import type {
    TableState,
    TableStateAction,
    VisualPlayerState,
    VisualTableState,
} from "../datatypes/table_state";
import { error, range } from "functional-utilities";
import Table from "./table";
import { create_deck } from "../scripts/create_deck";

function generate_game(player_amount: number, table_id: string): TableState {
    const deck = create_deck();
    if (player_amount > 10) {
        throw new Error("Too many players");
    }

    const players = range(player_amount).map((i) => {
        return {
            name: `Player ${i + 1}`,
            bet: 0,
            hand: deck.splice(0, 2),
            remainingChips: 100,
            folded: false,
        };
    });

    const centerCards = deck.splice(0, 5);

    return {
        players,
        centerCards,
        pot: 0,
        centerRevealAmount: 0,
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
    const next_center = () => {
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
                draft.requireBetRound = false;
                draft.currentPlayerIndex =
                    (draft.currentPlayerIndex + 1) % draft.players.length;
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
                draft.requireBetRound = true;
            } else if (action.type === "fold") {
                (
                    draft.players[draft.currentPlayerIndex] ??
                    error("Current player is undefined")
                ).folded = true;
            }
            next_player();
        });
    }
    function create_visual_player_state(
        player: TableState["players"][number],
        index: number
    ): VisualPlayerState {
        return {
            ...player,
            you: index === tableState.currentPlayerIndex, // Because it's single player, you are always the current player
            turn: index === tableState.currentPlayerIndex,
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
        <Table
            submit_action={action_handler}
            state={create_visual_table_state(tableState)}
        />
    );
}

export default SinglePlayer;
