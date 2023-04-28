import type { NextApiHandler } from "next";


const handler: NextApiHandler = (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send({ message: 'Only POST requests allowed' })
        return
    }

    console.log(JSON.stringify(req.body));

    res.status(200).send('Success');
};

export default handler;
