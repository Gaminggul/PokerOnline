import { useRouter } from "next/router";

function Lobby() {
    const router = useRouter();
    const { game_id } = router.query;

    return (
        <div>
            <h1>Game ID: {game_id}</h1>
        </div>
    );
}
