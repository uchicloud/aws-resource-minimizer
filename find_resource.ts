import { fromEnv } from '@aws-sdk/credential-providers';
import { __Client, ResourceExplorer2Client, SearchCommand, type Resource, type SearchCommandInput } from '@aws-sdk/client-resource-explorer-2'

type ResourceDict = {
    emptyTag: Resource[],
    remove: Resource[]
}

const client = new ResourceExplorer2Client({
    credentials: fromEnv()
});

export const countResources = async (params: SearchCommandInput): Promise<ResourceDict> => {
    const searchCommand = new SearchCommand(params);
    const thisMonth = getThisMonth();

    let res;
    const result: ResourceDict = 
        {'emptyTag': [], 'remove': []};
    do {
        res = await client.send(searchCommand);
        res.Resources?.filter((r) => r.Properties?.some((p) => Array.from(p.Data).every((obj) => obj.Key === 'Name'))).forEach((r) => result.emptyTag.push(r));
        res.Resources?.filter((r) => r.Properties?.some((p) => Array.from(p.Data).some((obj) => obj.Key.indexOf(thisMonth) === 0))).forEach((r) => result.remove.push(r));
        params.NextToken = res.NextToken;
    } while (res.NextToken);

    return result;
}

export const getThisMonth = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return `${year}${month.toString().padStart(2, '0')}`;
}

countResources({ QueryString: 'resourcetype:ec2:instance' }).then(r => console.dir(r, {depth: 6})).catch(console.error);