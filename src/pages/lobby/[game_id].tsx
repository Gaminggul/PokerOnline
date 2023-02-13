import { useRouter } from "next/router";
import { Layout } from "../../components/layout";
import SinglePlayer from "../../components/single_player";

function Lobby() {
    const router = useRouter();
    const { game_id } = router.query;

    return (
        <Layout show_banner={false}>
            <div className="p-8">
                {game_id && typeof game_id === "string" ? (
                    <SinglePlayer tableId={game_id} />
                ) : (
                    <div>Game not found</div>
                )}
            </div>
        </Layout>
    );
}

export default Lobby;
