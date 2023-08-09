import { NonEmptyArray } from "functional-utilities";
import { player_start_amount } from "../../../../code/constants";

export function lobby_ready<T>(
    lobby: { users: T[]; size: number },
    user_amount_override?: number
): lobby is { users: NonEmptyArray<T>; size: number } {
    const user_amount = user_amount_override ?? lobby.users.length;
    return user_amount > player_start_amount - 1 || user_amount == lobby.size;
}