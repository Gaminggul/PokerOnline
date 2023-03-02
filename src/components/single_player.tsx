import type {
    GameData,
    PlayerAction,
    VisualPlayerState,
    VisualTableState,
} from "../scripts/game_data";
import { error, tuple_zip } from "functional-utilities";
import Table from "./table";
import { useState } from "react";
import { v4 } from "uuid";
import { compute_next_state, generate_game } from "../scripts/game";
import { type UserData } from "../scripts/user_data";

interface SinglePlayerGameState {
    game_data: GameData;
    user_data: UserData[];
}

const start_user_data: UserData[] = [
    {
        chip_amount: 1000,
        id: v4(),
        name: "Player 1",
    },
    {
        chip_amount: 1000,
        id: v4(),
        name: "Player 2",
    },
];

function SinglePlayer(props: { id: string }) {
    const [spGameState, setSpGameState] = useState<SinglePlayerGameState>({
        game_data: generate_game(start_user_data, v4()),
        user_data: start_user_data,
    });
    const [gameActive, setGameActive] = useState(true);

    function get_user(playerId: string): UserData {
        return (
            spGameState.user_data.find((p) => p.id === playerId) ??
            error("Player not found")
        );
    }
    function action_handler(action: PlayerAction) {
        const { state: new_game_data, end_of_game: end_of_round } =
            compute_next_state(spGameState.game_data, action);
        const new_user_data = end_of_round
            ? tuple_zip([spGameState.user_data, new_game_data.players]).map(
                  ([player, new_player]) => ({
                      ...player,
                      remainingChips: new_player.chip_amount,
                  })
              )
            : spGameState.user_data;
        setSpGameState({
            game_data: new_game_data,
            user_data: new_user_data,
        });
        setGameActive(!end_of_round);
        if (end_of_round) {
            setTimeout(() => {
                setSpGameState((spGameState) => ({
                    game_data: generate_game(spGameState.user_data, props.id),
                    user_data: spGameState.user_data,
                }));
                setGameActive(true);
            }, 3000);
        }
    }
    function create_visual_player_state(
        player: GameData["players"][number],
        user_data: UserData[],
        index: number,
        end_of_round: boolean
    ): VisualPlayerState {
        const you = index === spGameState.game_data.currentPlayerIndex;
        const show_cards = you || end_of_round;
        const user = get_user(player.id);
        return {
            you,
            turn: you && !end_of_round, // Because it's single player, you are always the current player
            remainingChips: player.chip_amount,
            card1: show_cards ? player.card1 : "hidden",
            card2: show_cards ? player.card2 : "hidden",
            bet: player.bet,
            id: player.id,
            name: user.name,
            folded: player.folded,
        };
    }
    function create_visual_table_state(
        spGameState: SinglePlayerGameState,
        end_of_round: boolean
    ): VisualTableState {
        const game_data = spGameState.game_data;
        const table = {
            centerCards: game_data.centerCards.map((card, i) =>
                i < game_data.centerRevealAmount ? card : "hidden"
            ),
            players: game_data.players.map((p, i) =>
                create_visual_player_state(
                    p,
                    spGameState.user_data,
                    i,
                    end_of_round
                )
            ),
            id: game_data.id,
            pot: game_data.pot,
            end_of_round,
        } satisfies VisualTableState;
        return table;
    }

    return (
        <div className="flex w-full">
            <Table
                submit_action={action_handler}
                state={create_visual_table_state(spGameState, !gameActive)}
            />
            {/* <div className="w-[300px] text-xs">
                <p>State</p>
                <pre>{JSON.stringify(tableState, null, 2)}</pre>
            </div> */}
        </div>
    );
}

export default SinglePlayer;
