import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { Logger } from '../../shared/Logger';
import { validateAuthToken } from '../../shared/authHelper';
import { isDebug } from '../../config/config';

export const FunctionHandler =
  (handler: AzureFunction, skipAuth: boolean = false) =>
  async (context: Context, req: HttpRequest): Promise<void> => {
    const log = new Logger(context.log);

    log.logInfo(`[${context.invocationId}] Request started: ${JSON.stringify(req)}`);

    const start = process.hrtime();
    try {
      if (!skipAuth) {
        validateAuthToken(req.headers['authorization']);
      }

      await handler(context, req, log);
      log.logInfo('Execution finished successfully.');
    } catch (e) {
      const isUnauthorized = e.message?.includes('unauthorized');
      log.logError(
        isUnauthorized ? 'Unauthorized error occurred.' : 'Error occurred during execution.',
        e
      );
      context.res = {
        status: isUnauthorized ? 401 : 500,
        body: {
          error: isUnauthorized
            ? 'Unauthorized: Missing or invalid token'
            : 'Internal Server Error',
        },
      };
    } finally {
      const end = process.hrtime(start);
      const timeSpanMilliseconds = (end[0] * 1e9 + end[1]) / 1e6;

      log.logInfo(
        isDebug
          ? `Execution finished. Time: ${timeSpanMilliseconds} ms`
          : `Execution finished. Result: ${JSON.stringify(context.res)}. Time: ${timeSpanMilliseconds} ms`
      );
    }
  };
