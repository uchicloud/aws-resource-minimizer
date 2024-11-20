import type { Handler } from "aws-lambda";
import crypto from 'crypto';
import { categorizeResources, getThisMonth } from './find_resource.ts';
import { saveS3 } from "./save_s3.ts";

const secret = process.env.DING_SECRET ?? '';
const endpoint = process.env.DING_ENDPOINT ?? '';

const messageDict: {[K: string]: string;} = {
    'resourcetype:ec2:instance': 'EC2インスタンス',
    'resourcetype:ec2:instance_en': 'EC2 Instance',
    'resourcetype:rds:db-instance': 'RDSインスタンス',
    'resourcetype:rds:db-instance_en': 'RDS Instance',
};

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
    const { QueryString, skipNotify } = event;

    if (QueryString) {
        const result = await categorizeResources({ QueryString });
        let message = '';

        if (result.emptyTag.length) {
            const resources = result.emptyTag;
            message += `タグのない${messageDict[QueryString]}が${resources.length}件あります🤖
対象リソース:
${resources.flatMap((r) => r.Properties?.map((p) =>
                (p.Data as { [K: string]: string }[])?.filter((d) =>
                    d.Key === 'Name').map((d) => '- ' + d.Value))).join('\n')}`;
        }

        if (result.remove.length) {
            const resources = result.remove;
            message.length && (message += '\n\n');
            message += `今月までの${messageDict[QueryString]}が${resources.length}件あります🤖
対象リソース:
${resources.flatMap((r) => r.Properties?.map((p) =>
                (p.Data as { [K: string]: string }[])?.filter((d) =>
                    d.Key === 'Name').map((d) => '- ' + d.Value))).join('\n')}`;
        }

        if (result.over.length) {
            const resources = result.over;
            message.length && (message += '\n\n');
            message += `期限超過の${messageDict[QueryString]}が${resources.length}件あります🤖
対象リソース:
${resources.flatMap((r) => r.Properties?.map((p) =>
                (p.Data as { [K: string]: string }[])?.filter((d) =>
                    d.Key === 'Name').map((d) => '- ' + d.Value))).join('\n')}`;
        }

        if (result.error.length) {
            const resources = result.error;
            message.length && (message += '\n\n');
            message += `不正な日付タグの${messageDict[QueryString]}が${resources.length}件あります🤖
対象リソース:
${resources.flatMap((r) => r.Properties?.map((p) =>
                (p.Data as { [K: string]: string }[])?.filter((d) =>
                    d.Key === 'Name').map((d) => '- ' + d.Value))).join('\n')}`;

        }

        console.log('MESSAGE: \n' + message);

        if (!skipNotify) {
            const res = await send_message(message);
            const json = await res.json();
            console.log('RESPONSE: \n' + JSON.stringify(json, null, 2));
        }

        let saved;
        [...Array(5)].some(async (_) =>
            saveS3(result, getThisMonth(), messageDict[QueryString+'_en'])
                .then((r) => (saved = r) ? true : false)
        );
        if (!saved) {
            console.error('ALERT: S3への保存に失敗しました');
        }

    }
    return context.logStreamName;
}