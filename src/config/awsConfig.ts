import * as AWS from 'aws-sdk';
import { env_config } from './config';

const s3 = new AWS.S3({
  accessKeyId: env_config.awsAccessKeyId,
  secretAccessKey: env_config.awsSecretAccessKey,
  region: env_config.awsRegion,
  signatureVersion: 'v4',
});

export const generatePresignedUrl = async ({
  body,
}: {
  body: { fileName: string; fileType: string };
}): Promise<string> => {
  const { fileName, fileType } = body;

  const params = {
    Bucket: env_config.awsBucketName,
    Key: `${fileName}`,
    Expires: 60,
    ContentType: fileType,
  };

  try {
    return await s3.getSignedUrlPromise('putObject', params);
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw new Error('Failed to generate pre-signed URL');
  }
};
