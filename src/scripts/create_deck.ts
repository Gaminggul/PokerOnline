import { shuffle } from "lodash-es";
import { cards, type CardId } from "./cards";

export function create_deck(): CardId[] {
    return shuffle(cards);
}
