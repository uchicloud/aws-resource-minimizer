import { fromEnv } from '@aws-sdk/credential-providers';
import { __Client, ResourceExplorer2Client, SearchCommand, type SearchCommandInput } from '@aws-sdk/client-resource-explorer-2'

type Resource = {
    Arn: string;
    LastReportedAt: Date;
    OwingAccountId: string;
    Properties: Array<{
        Data: Array<{
            Key: string;
            Value: string;
        }>;
        LastReportedAt: Date;
        Name: string;
    }>;
    Region: string;
    ResourceType: string;
    Service: string;
}

const client = new ResourceExplorer2Client({
    credentials: fromEnv()
});

export const countResources = async (params: SearchCommandInput): Promise<number> => {
    const searchCommand = new SearchCommand(params);

    let res;
    let count: number = 0;
    do {
        res = await client.send(searchCommand);
        res.Resources?.filter((r) => r.Properties?.some((p) => Array.from(p.Data).every((obj) => obj.Key === 'Name'))).forEach((r) => {console.dir(r, { depth: 4}); count++});
        params.NextToken = res.NextToken;
    } while (res.NextToken);

    return count;
}

// countResources({ QueryString: 'resourcetype:ec2:instance' }).then(console.log).catch(console.error);