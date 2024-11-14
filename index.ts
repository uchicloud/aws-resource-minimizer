import type { Handler } from "aws-lambda";
import crypto from 'crypto';
import { countResources } from './find_resource.ts';

const secret = process.env.DING_SECRET ?? '';
const endpoint = process.env.DING_ENDPOINT ?? '';

const calcHmac = (time: number) => {
    const sign = `${time}\n${secret}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(sign);
    const digest = hmac.digest('base64');
    return encodeURIComponent(digest);
}

const send_message = async (content: string) => {
    const now = Date.now();
    const hmac = calcHmac(now);
    const url = `${endpoint}&timestamp=${now}&sign=${hmac}`;
    const message = {
        "msgtype": "text",
        "text": {
            content
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'charset': 'utf-8',
        },
        body: JSON.stringify(message)
    });

    if (!res.ok) {
        throw new Error(`Failed to send message: ${res.statusText}`);
    }
    return res;
}

export const handler: Handler = async (event, context) => {
    const QueryString = event.QueryString ?? '';

    if (QueryString) {
        const count = await countResources({ QueryString });
    
        const message = `タグのない${QueryString}が${count}件あります🤖`;
    
        const res = await send_message(message);
        const json = await res.json();
        console.log('RESPONSE: \n' + JSON.stringify(json, null, 2));
    }
    return context.logStreamName;
}