import { NextApiHandler } from "next";

const handler: NextApiHandler = async (req, res) => {
    console.log("pusher_poker_existence", JSON.stringify(req.body));

    res.status(200).json({ status: "ok" });
};

export default handler;
