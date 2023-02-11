import { shuffle } from "lodash-es";
import { cards, type CardId } from "../datatypes/cards";

export function create_deck(): CardId[] {
    return shuffle(cards)
}