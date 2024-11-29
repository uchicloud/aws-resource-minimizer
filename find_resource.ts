import { fromEnv } from '@aws-sdk/credential-providers';
import { __Client, ResourceExplorer2Client, SearchCommand, type SearchCommandInput } from '@aws-sdk/client-resource-explorer-2'
import { getThisMonth, isBeforeThisMonth, isValidDate } from './utility';
import { ignoreTags, type ResourceDict} from './constants';

const client = new ResourceExplorer2Client({
    credentials: fromEnv()
});

export const categorizeResources = async (params: SearchCommandInput, thisMonth: Date): Promise<ResourceDict> => {
    const searchCommand = new SearchCommand(params);
    const yyyyMM = `${thisMonth.getFullYear()}${(thisMonth.getMonth() + 1).toString().padStart(2, '0')}`;

    let res;
    const result: ResourceDict =
        { 'emptyTag': [], 'remove': [], 'over': [], 'error': [] };
    do {
        res = await client.send(searchCommand);
        res.Resources?.forEach((r) => 
            r.Properties?.forEach((p) => {
                const d = (p.Data as { [K: string]: string }[]) ?? [];
                if (d.map(obj => obj.Key).every(key => key !== 'Name')) {
                    const Value = r.Arn?.split(':').slice(-1)[0] ?? 'Unknown';
                    d.push({ Key: 'Name', Value });
                }
                if (d.every((obj) => ignoreTags.includes(obj.Key))) {
                    result.emptyTag.push(r);
                } else if (d.some((obj) => obj.Key.indexOf(yyyyMM) === 0)) {
                    result.remove.push(r);
                } else if (d.some((obj) => !isValidDate(obj))) {
                    result.error.push(r);
                } else if (d.some((obj) => isBeforeThisMonth(obj, thisMonth))) {
                    result.over.push(r);
                }
            })
        );
        params.NextToken = res.NextToken;
    } while (res.NextToken);

    return result;
}

// categorizeResources({ QueryString: 'resourcetype:rds:db' }, getThisMonth()).then(r => console.dir(r, { depth: 6 })).catch(console.error);
