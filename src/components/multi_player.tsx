import { useEffect, useState } from "react";
import {
    VisualTableStateSchema,
    type VisualTableState,
} from "../scripts/table_state";
import { api } from "../utils/api";
import { subscribe, unsubscribe } from "../scripts/pusher";
import Table from "./table";

function MultiPlayer({ tableId }: { tableId: string }) {
    const [visualTableState, setVisualTableState] = useState<
        VisualTableState | undefined
    >(undefined);
    const channelIdQuery = api.game.getChannelId.useQuery({ tableId });
    const submitActionQuery = 
    
    useEffect(() => {
        if (channelIdQuery.status !== "success") {
            return;
        }
        const channelId = channelIdQuery.data.channelId;
        const channel = subscribe(channelId);

        channel.bind("update", (newData: unknown) => {
            const newVisualTableState =
                VisualTableStateSchema.safeParse(newData);
            if (newVisualTableState.success) {
                setVisualTableState(newVisualTableState.data);
            } else {
                console.error("Invalid data received from server");
                console.error(newVisualTableState.error);
            }
        });

        return () => {
            channel.unbind_all();
            unsubscribe(channelId);
        };
    }, [channelIdQuery.data, channelIdQuery.status]);

    return (
        <div>
            {visualTableState ? (
                <Table
                    state={visualTableState}
                    submit_action={(action) => {
                        return;
                    }}
                />
            ) : (
                <div>Loading...</div>
            )}
        </div>
    );
}
