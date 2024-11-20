import { S3Client, PutObjectCommand, type PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-providers';
import path from 'path';
import type { ResourceDict } from './find_resource';

const bucket = process.env.S3_BUCKET ?? '';
const client = new S3Client({
    credentials: fromEnv()
});

export const saveS3 = async (data: ResourceDict, thisMonth: Date, type: string): Promise<PutObjectCommandOutput | null> => {
    const today = new Date();
    today.setHours(today.getUTCHours() + 9);

    const expire_date = new Date(thisMonth);
    expire_date.setMonth(expire_date.getMonth() + 6);
    
    const params = {
        Bucket: bucket,
        Key: path.posix.join('delete-candidates', thisMonth.toISOString().slice(0, 10), type, 'resources.json'),
        Body: JSON.stringify(data, null, 3),
        ContentType: 'application/json',
        Expires: expire_date,
    };
    const command = new PutObjectCommand(params);

    try {
        const res = await client.send(command);
        console.log('S3に保存しました: ', res);
        return res;
    } catch (e) {
        console.error('S3への保存に失敗しました: ', e);
        return null;
    }
}
