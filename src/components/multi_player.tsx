import { useEffect, useState } from "react";
import {
    VisualTableStateSchema,
    type VisualTableState,
} from "../scripts/table_state";
import { api } from "../utils/api";
import { subscribe, unsubscribe } from "../scripts/pusher";
import Table from "./table";

function MultiPlayer() {
    const [visualTableState, setVisualTableState] = useState<
        VisualTableState | undefined
    >(undefined);
    const channelIdQuery = api.game.getChannelId.useQuery();
    const submitActionQuery = api.game.submitGameAction.useMutation();

    useEffect(() => {
        if (!channelIdQuery.data) {
            return;
        }
        const channelId = channelIdQuery.data.channel;
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
    }, [channelIdQuery.data]);

    return (
        <div>
            {visualTableState ? (
                <Table
                    state={visualTableState}
                    submit_action={submitActionQuery.mutate}
                />
            ) : (
                <div>Loading...</div>
            )}
        </div>
    );
}
