import Image from "next/image";
import { type CardId, get_combination } from "../scripts/cards";
import type {
    VisualPlayerState,
    VisualTableState,
    TableStateAction,
} from "../scripts/table_state";
import { useState } from "react";
import { max } from "lodash-es";
import { error } from "functional-utilities";

function Table({
    state,
    submit_action,
}: {
    state: VisualTableState;
    submit_action: (action: TableStateAction) => void;
}) {
    const [bet, setBet] = useState(1);
    const [betInput, setBetInput] = useState("1");
    const min_bet =
        max([
            state.players.reduce((min, player) => {
                if (player.bet < min) {
                    return player.bet;
                } else {
                    return min;
                }
            }, 1),
            1,
        ]) ?? error("No min bet");
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
                                        type="text"
                                        value={betInput}
                                        onChange={(e) => {
                                            setBetInput(e.target.value);
                                            const bet = parseInt(
                                                e.target.value
                                            );
                                            if (!isNaN(bet)) {
                                                setBet(bet);
                                            }
                                        }}
                                    />
                                </div>
                                <UiButton
                                    onClick={() =>
                                        submit_action({
                                            type: "bet",
                                            bet,
                                        })
                                    }
                                    locked={
                                        bet < min_bet || !parseInt(betInput)
                                    }
                                >
                                    Bet
                                </UiButton>
                                {bet < min_bet && !isNaN(parseInt(betInput)) ? (
                                    <p className="text-red-500">
                                        Bet must be at least {min_bet}
                                    </p>
                                ) : null}
                                {!isNaN(parseInt(betInput)) ? null : (
                                    <p className="text-red-500">
                                        Bet must be a number
                                    </p>
                                )}
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
    locked,
}: {
    onClick: () => void;
    children: React.ReactNode;
    locked?: boolean;
}) {
    return (
        <>
            {locked ? (
                <button
                    className="rounded-md bg-gray-300 px-4 py-2 text-gray-700"
                    onClick={onClick}
                >
                    {children}
                </button>
            ) : (
                <button
                    className="rounded-md bg-blue-500 px-4 py-2 text-white"
                    onClick={onClick}
                >
                    {children}
                </button>
            )}
        </>
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
