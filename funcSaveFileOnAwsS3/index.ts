import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { generatePresignedUrl } from '../src/config/awsConfig';

const funcSaveFileOnAwsS3: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  //   log.logInfo(`Http function processed request for url "${req.url}"`);

  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    context.res = {
      status: 400,
      body: 'Missing required fields: fileName and fileType',
    };
    return;
  }

  try {
    const url = await generatePresignedUrl({ body: { fileName, fileType } });
    context.res = {
      status: 200,
      body: { url },
    };
  } catch (error) {
    // log.logError('Error generating pre-signed URL:', error);
    context.res = {
      status: 500,
      body: `Error generating pre-signed URL: ${error.message}`,
    };
  }
};

export default funcSaveFileOnAwsS3;
