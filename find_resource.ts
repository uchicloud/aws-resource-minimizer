import { fromEnv } from '@aws-sdk/credential-providers';
import { __Client, ResourceExplorer2Client, SearchCommand, type Resource, type SearchCommandInput } from '@aws-sdk/client-resource-explorer-2'

const client = new ResourceExplorer2Client({
    credentials: fromEnv()
});

export const countResources = async (params: SearchCommandInput): Promise<{count: number; resources: Resource[]}> => {
    const searchCommand = new SearchCommand(params);

    let res;
    const result: {count: number; resources: Resource[]} = {count: 0, resources: []};
    do {
        res = await client.send(searchCommand);
        res.Resources?.filter((r) => r.Properties?.some((p) => Array.from(p.Data).every((obj) => obj.Key === 'Name'))).forEach((r) => {result.count++; result.resources.push(r)});
        params.NextToken = res.NextToken;
    } while (res.NextToken);

    return result;
}

// countResources({ QueryString: 'resourcetype:ec2:instance' }).then(r => console.dir(r, {depth: 6})).catch(console.error);