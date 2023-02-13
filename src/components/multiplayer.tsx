import { useEffect, useState } from "react";
import { cards } from "../scripts/cards";
import { VisualTableState } from "../scripts/table_state";

function MultiPlayer(props: { tableId: string }) {
    const [VisualTableState, setVisualTableState] = useState<VisualTableState>({
        centerCards: ["hearts_10", "hearts_jack", "hearts_queen", "hearts_king", "hearts_ace"],
        end_of_round: false,
        players: [{
            you: true,
            bet: 0,
            hand: "folded",
            name: "",
            remainingChips: 0,
            turn: false
        }],
        pot: 0,
        tableId: props.tableId
    })
    useEffect(() => {
        
    })
}
