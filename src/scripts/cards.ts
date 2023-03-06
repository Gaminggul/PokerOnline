import { error, typed_entries } from "functional-utilities";
import { max, maxBy, sortBy, uniq } from "lodash-es";
import { CardIdsSchema } from "./card_tuple";

const suits = ["clubs", "diamonds", "hearts", "spades"] as const;
type SuitId = (typeof suits)[number];

const ranks = [
    ["2", 2],
    ["3", 3],
    ["4", 4],
    ["5", 5],
    ["6", 6],
    ["7", 7],
    ["8", 8],
    ["9", 9],
    ["10", 10],
    ["jack", 11],
    ["queen", 12],
    ["king", 13],
    ["ace", 14],
] as const;

const score_map = new Map(ranks.map(([rank, score]) => [rank, score]));

type RankId = (typeof ranks)[number][0];

export const cards = suits.flatMap((suit) =>
    ranks.map(([rank]) => `${suit}_${rank}` as const)
);

export type CardId = (typeof cards)[number];

export type CombinationId =
    | "royal_flush"
    | "straight_flush"
    | "four_of_a_kind"
    | "full_house"
    | "flush"
    | "straight"
    | "three_of_a_kind"
    | "two_pair"
    | "pair"
    | "high_card";

function parse_card(card: CardId): [SuitId, RankId] {
    const [suit, rank] = card.split("_");
    return [suit, rank] as [SuitId, RankId];
}

function split_into_suits(cards: CardId[]): Record<SuitId, CardId[]> {
    return cards.reduce((acc, card) => {
        const [suit] = parse_card(card);
        acc[suit] = [...(acc[suit] || []), card];
        return acc;
    }, {} as Record<SuitId, CardId[]>);
}

function split_into_ranks(cards: CardId[]): Record<RankId, CardId[]> {
    return cards.reduce((acc, card) => {
        const [, rank] = parse_card(card);
        acc[rank] = [...(acc[rank] || []), card];
        return acc;
    }, {} as Record<RankId, CardId[]>);
}

function get_card_score(card: CardId): number {
    const [, rank] = parse_card(card);
    return get_rank_score(rank);
}

function get_rank_score(rank: RankId): number {
    return score_map.get(rank) ?? error(`Invalid card rank: ${rank}`);
}

function sort_cards_by_rank(cards: CardId[]): CardId[] {
    return sortBy(cards, (card) => get_card_score(card));
}

function longest_consecutive_sequence(arr: number[]): number[] {
    // return the longest consecutive sequence in the array
    // e.g. [1, 2, 3, 5, 6, 7, 9, 10, 11] -> [9, 10, 11]
    let longest: number[] = [];
    let current: number[] = [];
    for (const num of arr) {
        if (
            current.length === 0 ||
            num === (current.at(-1) ?? error("out of bounds")) + 1
        ) {
            current.push(num);
        } else {
            if (current.length > longest.length) {
                longest = current;
            }
            current = [num];
        }
    }
    if (current.length > longest.length) {
        longest = current;
    }
    return longest;
}

type CombinationEvaluator = (cards: CardId[]) =>
    | {
          type: "some";
          score: number; // This is used for tie-breaking
      }
    | {
          type: "none";
      };

interface Combination {
    id: CombinationId;
    evaluate: CombinationEvaluator;
    base_score: number;
}

function rank_evaluate(rank_amounts: number[]): CombinationEvaluator {
    // pair is [2]
    // two_pair is [2, 2]
    // three_of_a_kind is [3]
    // full_house is [3, 2] and so on

    const sorted_rank_amounts = sortBy(rank_amounts);
    return (cards: CardId[]) => {
        const ranks = split_into_ranks(cards);
        const remaining_sorted_ranks = sortBy(
            typed_entries(ranks),
            ([, cards]) => cards.length
        );
        let score = 0;
        for (const rank_amount of sorted_rank_amounts) {
            const valid_ranks = remaining_sorted_ranks
                .map((v, i) => [i, v] as const)
                .filter(([, entry]) => entry[1].length >= rank_amount);
            if (valid_ranks.length === 0) {
                return {
                    type: "none",
                };
            }
            const best_rank =
                maxBy(
                    valid_ranks.map(
                        (v) =>
                            [v[0], get_rank_score(v[1][0])] as [number, number]
                    ),
                    ([, score]) => score
                ) ?? error("No best rank");
            remaining_sorted_ranks.splice(best_rank[0], 1);
            score += best_rank[1] * rank_amount;
        }

        return {
            type: "some",
            score,
        };
    };
}

export const combinations = [
    {
        id: "high_card",
        evaluate: (cards: CardId[]) => {
            if (cards.length === 0) {
                return {
                    type: "none",
                };
            }
            return {
                type: "some",
                score: max(cards.map(get_card_score)) ?? error("No cards"),
            };
        },
        base_score: 1,
    },
    {
        id: "pair",
        evaluate: rank_evaluate([2]),
        base_score: 2,
    },
    {
        id: "two_pair",
        evaluate: rank_evaluate([2, 2]),
        base_score: 3,
    },
    {
        id: "three_of_a_kind",
        evaluate: rank_evaluate([3]),
        base_score: 4,
    },
    {
        id: "straight",
        evaluate: (cards: CardId[]) => {
            const sorted_cards = sort_cards_by_rank(cards);
            const ranks = uniq(sorted_cards.map(get_card_score));
            const longest = longest_consecutive_sequence(ranks);
            if (longest.length < 5) {
                return {
                    type: "none",
                };
            }
            return {
                type: "some",
                score: max(longest) ?? error("No cards"),
            };
        },
        base_score: 5,
    },
    {
        id: "flush",
        evaluate: (cards: CardId[]) => {
            const suits = split_into_suits(cards);
            const valid_suits = Object.values(suits).filter(
                (cards) => cards.length >= 5
            );
            if (valid_suits.length === 0) {
                return {
                    type: "none",
                };
            }
            const sorted_suits = sortBy(valid_suits, (cards) =>
                get_card_score(cards[0] ?? error("No cards"))
            );
            const combination_cards = sorted_suits[0]?.slice(0, 5);
            return {
                type: "some",
                score: get_card_score(
                    combination_cards?.[0] ?? error("No cards")
                ),
            };
        },
        base_score: 6,
    },
    {
        id: "full_house",
        evaluate: rank_evaluate([3, 2]),
        base_score: 7,
    },
    {
        id: "four_of_a_kind",
        evaluate: rank_evaluate([4]),
        base_score: 8,
    },
    {
        id: "straight_flush",
        evaluate: (cards: CardId[]) => {
            const suits = split_into_suits(cards);
            const suit_sequences = typed_entries(suits).map(([suit, cards]) => {
                const sorted_cards = sort_cards_by_rank(cards);
                const ranks = sorted_cards.map(get_card_score);
                const longest = longest_consecutive_sequence(ranks);
                return [suit, longest] as [SuitId, number[]];
            });
            const valid_suit_sequences = suit_sequences.filter(
                ([, sequence]) => sequence.length >= 5
            );
            if (valid_suit_sequences.length === 0) {
                return {
                    type: "none",
                };
            }
            return {
                type: "some",
                score:
                    max(
                        valid_suit_sequences.map(
                            ([, sequence]) => max(sequence) ?? error("No cards")
                        )
                    ) ?? error("No cards"),
            };
        },
        base_score: 9,
    },
    {
        id: "royal_flush",
        evaluate: (cards: CardId[]) => {
            const suits = split_into_suits(cards);
            const suit_sequences = typed_entries(suits).flatMap(
                ([suit, cards]) => {
                    const sorted_cards = sort_cards_by_rank(cards);
                    if (
                        parse_card(
                            sorted_cards.at(-1) ?? error("No cards")
                        )?.[1] !== "ace"
                    ) {
                        return [];
                    }
                    const ranks = uniq(sorted_cards.map(get_card_score));
                    const longest = longest_consecutive_sequence(ranks);
                    return [[suit, longest] as [SuitId, number[]]];
                }
            );
            const valid_suit_sequences = suit_sequences.filter(
                ([, sequence]) => sequence.length >= 5
            );
            if (valid_suit_sequences.length === 0) {
                return {
                    type: "none",
                };
            }
            return {
                type: "some",
                score:
                    max(
                        valid_suit_sequences.map(
                            ([, sequence]) => max(sequence) ?? error("No cards")
                        )
                    ) ?? error("No cards"),
            };
        },
        base_score: 10,
    },
] satisfies Combination[];

export type CombinationResult =
    | {
          type: "some";
          combination: CombinationId;
          cards: CardId[];
          base_score: number;
          score: number;
      }
    | {
          type: "none";
      };

export function get_combination(
    cards: (CardId | "hidden")[]
): CombinationResult {
    if (cards.length === 0 || cards.some((card) => card === "hidden")) {
        return {
            type: "none",
        };
    }
    const combinations_with_cards = combinations
        .map((combination) => {
            const combination_cards = combination.evaluate(
                CardIdsSchema.parse(cards)
            );
            if (combination_cards.type === "none") {
                return undefined;
            }
            return {
                combination: combination.id,
                base_score: combination.base_score,
                score: combination_cards.score,
            };
        })
        .filter((v) => v !== undefined) as {
        combination: CombinationId;
        score: number;
        base_score: number;
    }[];
    if (combinations_with_cards.length === 0) {
        return {
            type: "none",
        };
    }
    const best_combination =
        maxBy(
            combinations_with_cards,
            (combination) => combination.base_score
        ) ?? error("No combinations");
    return {
        type: "some",
        combination: best_combination.combination,
        cards: CardIdsSchema.parse(cards),
        score: best_combination.score,
        base_score: best_combination.base_score,
    };
}
