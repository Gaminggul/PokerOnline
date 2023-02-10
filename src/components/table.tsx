import type { CardId } from "../datatypes/cards";
import type {
    PlayerState,
    TableState,
    TableStateAction,
} from "../datatypes/table_state";
import { useState } from "react";

function Table({
    state,
    submit_action,
}: {
    state: TableState;
    submit_action: (action: TableStateAction) => void;
}) {
    const [bet, setBet] = useState(0);
    const min_bet = state.players.reduce((min, player) => {
        if (player.bet < min) {
            return player.bet;
        } else {
            return min;
        }
    }, 0);
    if (min_bet > bet) {
        setBet(min_bet);
    }
    const you_index = state.players.findIndex((player) => player.you);
    return (
        <div>
            <h2>Table ID: {state.tableId}</h2>
            {state.players[you_index]?.turn ? (
                <div>
                    <button onClick={() => submit_action({ type: "fold" })}>
                        Fold
                    </button>
                    <div>
                        <p>Min bet is {min_bet}</p>
                        <input
                            type="number"
                            value={bet}
                            onChange={(e) => setBet(Number(e.target.value))}
                        />
                        <button
                            onClick={() =>
                                submit_action({
                                    type: "bet",
                                    bet,
                                })
                            }
                        >
                            Bet
                        </button>
                    </div>
                </div>
            ) : (
                <p>Not your turn</p>
            )}
            <div>
                {state.players.map((player, i) => {
                    return (
                        <div key={i}>
                            <Player player={player} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Player({ player }: { player: PlayerState }) {
    return (
        <div>
            <h3>{player.name}</h3>
            <p>Bet: {player.bet}</p>
            <p>Chips: {player.remainingChips}</p>
            <div>
                {player.hand === "folded" ? (
                    <p>Folded</p>
                ) : (
                    player.hand.map((card, i) => {
                        return (
                            <div key={i}>
                                <Card card={card} />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function Card(props: { card: CardId | "hidden" }) {
    return <p>{props.card}</p>;
}

export default Table;
