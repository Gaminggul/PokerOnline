export function Btn(props: { text: string; onClick?: () => void }) {
    return (
        <button
            onClick={props.onClick}
            className="w-full py-4 pw-8 text-white bg-green-500 hover:bg-green-600 rounded-lg"
        >
            {props.text}
        </button>
    );
}