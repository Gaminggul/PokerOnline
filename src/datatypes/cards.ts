export const cards = [
    'clubs_2',
    'clubs_3',
    'clubs_4',
    'clubs_5',
    'clubs_6',
    'clubs_7',
    'clubs_8',
    'clubs_9',
    'clubs_10',
    'clubs_ace',
    'clubs_jack',
    'clubs_king',
    'clubs_queen',
    'diamonds_2',
    'diamonds_3',
    'diamonds_4',
    'diamonds_5',
    'diamonds_6',
    'diamonds_7',
    'diamonds_8',
    'diamonds_9',
    'diamonds_10',
    'diamonds_ace',
    'diamonds_jack',
    'diamonds_king',
    'diamonds_queen',
    'hearts_2',
    'hearts_3',
    'hearts_4',
    'hearts_5',
    'hearts_6',
    'hearts_7',
    'hearts_8',
    'hearts_9',
    'hearts_10',
    'hearts_ace',
    'hearts_jack',
    'hearts_king',
    'hearts_queen',
    'spades_2',
    'spades_3',
    'spades_4',
    'spades_5',
    'spades_6',
    'spades_7',
    'spades_8',
    'spades_9',
    'spades_10',
    'spades_ace',
    'spades_jack',
    'spades_king',
    'spades_queen'
] as const;

export type CardId = typeof cards[number];

type CombinationId = |
    'royal_flush' |
    'straight_flush' |
    'four_of_a_kind' |
    'full_house' |
    'flush' |
    'straight' |
    'three_of_a_kind' |
    'two_pair' |
    'pair' |
    'high_card';


export const combinations = [
    {
        id: 'royal_flush',
        cards: ['hearts_ace', 'hearts_king', 'hearts_queen', 'hearts_jack', 'hearts_10'],
        min_amount: 5,
        points: 10
    },
    {
        id: 'straight_flush',
        cards: ['hearts_ace', 'hearts_king', 'hearts_queen', 'hearts_jack', 'hearts_9'],
        min_amount: 5,
        points: 9
    },
    {
        id: 'four_of_a_kind',
        cards: ['hearts_ace', 'clubs_ace', 'diamonds_ace', 'spades_ace', 'hearts_9'],
        min_amount: 4,
        points: 8
    },
    {
        id: 'full_house',
        cards: ['hearts_ace', 'clubs_ace', 'diamonds_ace', 'spades_king', 'hearts_king'],
        min_amount: 5,
        points: 7
    },
    {
        id: 'flush',
        cards: ['hearts_ace', 'hearts_king', 'hearts_queen', 'hearts_9', 'hearts_8'],
        min_amount: 5,
        points: 6
    },
    {
        id: 'straight',
        cards: ['hearts_ace', 'clubs_king', 'diamonds_queen', 'spades_jack', 'hearts_10'],
        min_amount: 5,
        points: 5
    },
    {
        id: 'three_of_a_kind',
        cards: ['hearts_ace', 'clubs_ace', 'diamonds_ace', 'spades_king', 'hearts_9'],
        min_amount: 3,
        points: 4
    },
    {
        id: 'two_pair',
        cards: ['hearts_ace', 'clubs_ace', 'diamonds_king', 'spades_king', 'hearts_9'],
        min_amount: 4,
        points: 3
    },
    {
        id: 'pair',
        cards: ['hearts_ace', 'clubs_ace', 'diamonds_king', 'spades_queen', 'hearts_9'],
        min_amount: 2,
        points: 2
    },
    {
        id: 'high_card',
        cards: ['hearts_ace', 'clubs_king', 'diamonds_queen', 'spades_jack', 'hearts_9'],
        min_amount: 1,
        points: 1
    }
] satisfies { id: CombinationId, cards: CardId[], min_amount: number, points: number }[]