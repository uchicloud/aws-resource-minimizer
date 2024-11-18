import { fromEnv } from '@aws-sdk/credential-providers';
import { __Client, ResourceExplorer2Client, SearchCommand, type Resource, type SearchCommandInput } from '@aws-sdk/client-resource-explorer-2'

type ResourceDict = {
    emptyTag: Resource[],
    remove: Resource[],
    over: Resource[],
    error: Resource[],
}

const client = new ResourceExplorer2Client({
    credentials: fromEnv()
});

export const countResources = async (params: SearchCommandInput): Promise<ResourceDict> => {
    const searchCommand = new SearchCommand(params);
    const thisMonth = getThisMonth();
    const yyyyMM = `${thisMonth.getFullYear()}${(thisMonth.getMonth() + 1).toString().padStart(2, '0')}`;
     
    console.log(thisMonth, yyyyMM);

    let res;
    const result: ResourceDict = 
        {'emptyTag': [], 'remove': [], 'over': [], 'error': []};
    do {
        res = await client.send(searchCommand);
        res.Resources?.filter((r) => r.Properties?.some((p) => Array.from(p.Data).every((obj) => obj.Key === 'Name'))).forEach((r) => result.emptyTag.push(r));
        res.Resources?.filter((r) => r.Properties?.some((p) => Array.from(p.Data).some((obj) => obj.Key.indexOf(yyyyMM) === 0))).forEach((r) => result.remove.push(r));
        res.Resources?.filter((r) => r.Properties?.some((p) => Array.from(p.Data).some((obj) => obj.Key < yyyyMM && obj.Key < `${yyyyMM}01`))).forEach((r) => result.over.push(r));
        params.NextToken = res.NextToken;
    } while (res.NextToken);

    return result;
}

export const getThisMonth = (): Date => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    now.setDate(0);
    return now;
}

countResources({ QueryString: 'resourcetype:ec2:instance' }).then(r => console.dir(r, {depth: 6})).catch(console.error);