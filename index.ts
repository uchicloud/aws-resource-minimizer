import type { Handler } from "aws-lambda";
import { categorizeResources } from './find_resource';
import { saveS3 } from "./save_s3";
import { messageDict } from './constants'
import { getThisMonth, send_message } from './utility';

export const handler: Handler = async (event, context) => {
    const { QueryString, skipNotify } = event;
    const thisMonth = getThisMonth();

    if (QueryString) {
        const result = await categorizeResources({ QueryString }, thisMonth);
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

        if (!message.length) {
            message = `削除する${messageDict[QueryString]}はありません🎉`;
        }
        console.log('MESSAGE: \n' + message);

        if (!skipNotify) {
            const res = await send_message(message);
            const json = await res.json();
            console.log('RESPONSE: \n' + JSON.stringify(json, null, 2));
        }

        for (const _ of Array(5)) {
            const res = await saveS3(result, thisMonth, messageDict[QueryString+'_en']);
            if (res) {
                break;
            }
        }

    }
    return context.logStreamName;
}