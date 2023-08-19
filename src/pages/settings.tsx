import { Layout } from "../components/layout";

function Settings() {
    return (
        <Layout show_banner={true}>
            <div className="h-screen p-12">
                <h2 className="text-center text-3xl">Settings</h2>
                <p>Dark mode</p>
                {/* On/off Switch for Dark mode, not finished*/}
                <button>On/Off</button>
            </div>
        </Layout>
    );
}

export default Settings;
