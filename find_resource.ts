import { fromEnv } from '@aws-sdk/credential-providers';
import { __Client, ResourceExplorer2Client, SearchCommand, type Resource, type SearchCommandInput } from '@aws-sdk/client-resource-explorer-2'
import { isBeforeThisMonth, isValidDate } from './utility';

export type ResourceDict = {
    emptyTag: Resource[], // Nameタグのみのリソース
    remove:   Resource[], // yyyyMM形式のタグが含まれているリソース
    over:     Resource[], // yyyyMM形式のタグが含まれており、かつそのタグが現在の月よりも前のリソース
    error:    Resource[], // 存在しない日付タグがついたリソース
}

const client = new ResourceExplorer2Client({
    credentials: fromEnv()
});

export const categorizeResources = async (params: SearchCommandInput): Promise<ResourceDict> => {
    const searchCommand = new SearchCommand(params);
    const thisMonth = getThisMonth();
    const yyyyMM = `${thisMonth.getFullYear()}${(thisMonth.getMonth() + 1).toString().padStart(2, '0')}`;

    let res;
    const result: ResourceDict =
        { 'emptyTag': [], 'remove': [], 'over': [], 'error': [] };
    do {
        res = await client.send(searchCommand);
        res.Resources?.forEach((r) => 
            r.Properties?.forEach((p) => {
                if ((p.Data as { [K: string]: string }[]).every((obj) => obj.Key === 'Name')) {
                    result.emptyTag.push(r);
                } else if ((p.Data as { [K: string]: string }[]).some((obj) => obj.Key.indexOf(yyyyMM) === 0)) {
                    result.remove.push(r);
                } else if ((p.Data as { [K: string]: string }[]).some((obj) => !isValidDate(obj))) {
                    result.error.push(r);
                } else if ((p.Data as { [K: string]: string }[]).some((obj) => isBeforeThisMonth(obj, thisMonth))) {
                    result.over.push(r);
                }
            })
        );
        params.NextToken = res.NextToken;
    } while (res.NextToken);

    return result;
}

export const getThisMonth = (): Date => {
    const now = new Date();
    // UTC -> JST
    now.setHours(now.getUTCHours() + 9, 59, 59, 999);
    // 今月末の日付に変更
    now.setMonth(now.getMonth() + 1);
    now.setDate(0);
    return now;
}

// categorizeResources({ QueryString: 'resourcetype:ec2:instance' }).then(r => console.dir(r, { depth: 6 })).catch(console.error);
