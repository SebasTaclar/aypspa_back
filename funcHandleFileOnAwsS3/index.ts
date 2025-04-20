import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { generatePresignedGetUrl, generatePresignedSaveUrl } from '../src/config/awsConfig';

const funcHandleFileOnAwsS3: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  //   log.logInfo(`Http function processed request for url "${req.url}"`);

  const { fileName, fileType, action } = req.body;

  if (!fileName || !action) {
    context.res = {
      status: 400,
      body: 'Missing required fields: fileName and action',
    };
    return;
  }

  try {
    let url: string;

    if (action === 'save') {
      if (!fileType) {
        context.res = {
          status: 400,
          body: 'Missing required field: fileType for save action',
        };
        return;
      }
      url = await generatePresignedSaveUrl({ body: { fileName, fileType } });
    } else if (action === 'retrieve') {
      url = await generatePresignedGetUrl(fileName);
    } else {
      context.res = {
        status: 400,
        body: 'Invalid action. Allowed values are "save" or "retrieve".',
      };
      return;
    }

    context.res = {
      status: 200,
      body: { url },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: `Error generating pre-signed URL: ${error.message}`,
    };
  }
};

export default funcHandleFileOnAwsS3;
