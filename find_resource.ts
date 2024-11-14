import { fromIni, fromEnv } from '@aws-sdk/credential-providers';
import { ResourceExplorer2Client, SearchCommand, type SearchCommandInput } from '@aws-sdk/client-resource-explorer-2'

const client = new ResourceExplorer2Client({
    credentials: fromEnv()
});

export const countResources = async (params: SearchCommandInput): Promise<number> => {
    const searchCommand = new SearchCommand(params);

    let res;
    let count: number = 0;
    do {
        res = await client.send(searchCommand);
        // console.dir(res.Resources, { depth: 6 });
        res.Resources?.filter(r => r.Properties?.some(p => Array.from(p.Data).every(obj => obj.Key === 'Name'))).forEach(r => console.dir(r, { depth: 4}));
        params.NextToken = res.NextToken;
        count += res.Resources?.filter(r => r.Properties?.some(p => Array.from(p.Data).every(obj => obj.Key === 'Name'))).length ?? 0;
    } while (res.NextToken);

    return count;
}

// countResources({ QueryString: 'Resource type = ec2:instance' }).then(console.log).catch(console.error);