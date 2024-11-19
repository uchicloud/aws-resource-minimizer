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

    console.log('MESSAGE SENT: \n' + JSON.stringify(message, null, 2));
    return res;
}

export const handler: Handler = async (event, context) => {
    const { QueryString, isSend } = event;

    if (QueryString) {
        const { count, resources } = await countResources({ QueryString });

        const message = `タグのない${QueryString}が${count}件あります🤖
対象リソース:
${resources.map((r) => r.Properties?.map((p) => Array.from(p.Data).filter((d) => d.Key === 'Name').map((d) => '- ' + d.Value).join('\n'))).join('\n')}`;

        if (isSend) {
            const res = await send_message(message);
            const json = await res.json();
            console.log('RESPONSE: \n' + JSON.stringify(json, null, 2));
        }
    }
    return context.logStreamName;
}