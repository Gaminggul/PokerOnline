import Image from "next/image";
import { type CardId, get_combination } from "../scripts/cards";
import type {
    VisualPlayerState,
    VisualTableState,
    TableStateAction,
} from "../scripts/table_state";
import { useState } from "react";

function Table({
    state,
    submit_action,
}: {
    state: VisualTableState;
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
        <div className="flex w-full flex-col gap-8">
            <h2>Table ID: {state.tableId}</h2>
            <div className="flex justify-center gap-4">
                {state.centerCards.map((card, i) => {
                    return (
                        <div key={i}>
                            <Card card={card} width={100} />
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-center">
                <div className="flex flex-col items-center">
                    <div>
                        <p>Your combinations</p>
                        <div className="flex gap-2">
                            {(() => {
                                const hand = state.players[you_index]?.hand;
                                if (hand === "folded") {
                                    return <p>Folded</p>;
                                }
                                if (hand) {
                                    const combination = get_combination(
                                        hand.concat(
                                            state.centerCards.filter(
                                                (card) => card !== "hidden"
                                            )
                                        )
                                    );
                                    if (combination.type === "some") {
                                        return (
                                            <div>
                                                <p>
                                                    Type:{" "}
                                                    {combination.combination}
                                                </p>
                                                <p>
                                                    Base Score:{" "}
                                                    {combination.base_score}
                                                </p>
                                                <p>
                                                    Score: {combination.score}
                                                </p>
                                                <p>
                                                    Cards:{" "}
                                                    {combination.cards
                                                        .map((card) => card)
                                                        .join(", ")}
                                                </p>
                                            </div>
                                        );
                                    }
                                }
                            })()}
                        </div>
                    </div>
                    {state.players[you_index]?.turn ? (
                        <div className="flex items-center gap-8 ">
                            <UiButton
                                onClick={() => submit_action({ type: "fold" })}
                            >
                                Fold
                            </UiButton>
                            <div className="flex items-center gap-4">
                                <div>
                                    <p>Min bet is {min_bet}</p>
                                    <input
                                        type="number"
                                        value={bet}
                                        onChange={(e) =>
                                            setBet(Number(e.target.value))
                                        }
                                    />
                                </div>
                                <UiButton
                                    onClick={() =>
                                        submit_action({
                                            type: "bet",
                                            bet,
                                        })
                                    }
                                >
                                    Bet
                                </UiButton>
                            </div>
                        </div>
                    ) : (
                        <p>Not your turn</p>
                    )}
                </div>
            </div>
            <div className="flex justify-between">
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

function UiButton({
    onClick,
    children,
}: {
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            className="rounded bg-blue-500 py-2 px-4 font-bold text-white hover:bg-blue-700"
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function Player({ player }: { player: VisualPlayerState }) {
    return (
        <div>
            <h3>{player.you ? `${player.name} - You` : player.name}</h3>
            <p>Bet: {player.bet}</p>
            <p>Chips: {player.remainingChips}</p>
            <div className="flex gap-2">
                {player.hand === "folded" ? (
                    <p>Folded</p>
                ) : (
                    player.hand.map((card, i) => {
                        return (
                            <div key={i}>
                                <Card card={card} width={50} />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function Card(props: { card: CardId | "hidden"; width: number }) {
    const ratio = 333 / 234;
    const height = props.width * ratio;
    return (
        <Image
            src={`/cards/${props.card}.svg`}
            alt={props.card}
            width={props.width}
            height={height}
        />
    );
}

export default Table;
