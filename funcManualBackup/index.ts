import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { BackupFactory } from '../src/factories/BackupFactory';
import { Logger } from '../src/shared/Logger';
import { FunctionHandler } from '../src/application/services/Main';

// Request body interface
interface BackupRequest {
  emails?: string[];
}

const funcManualBackup: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const log = new Logger(context.log);

  try {
    // Initialize backup service
    const backupService = await BackupFactory(log);

    // Get custom emails from request body
    const requestBody = req.body as BackupRequest;
    const customEmails = requestBody?.emails;

    // Generate backup
    const result = await backupService.generateBackup({
      customEmails: customEmails,
      backupType: 'manual',
    });

    if (result.success && result.data) {
      context.res = {
        status: 200,
        body: {
          success: true,
          message: 'Backup manual realizado y enviado exitosamente',
          data: {
            ...result.data,
            sampleData: {
              // Note: sampleData would need to be added to BackupService if needed
              firstClient: null,
              firstProduct: null,
              firstRent: null,
            },
          },
        },
      };
    } else {
      context.res = {
        status: 500,
        body: {
          success: false,
          message: 'Error durante el backup manual',
          error: result.error || 'Error desconocido',
          backupType: 'manual',
        },
      };
    }
  } catch (error) {
    log.logError(
      `❌ Error durante el backup manual: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );

    context.res = {
      status: 500,
      body: {
        success: false,
        message: 'Error durante el backup manual',
        error: error instanceof Error ? error.message : 'Error desconocido',
        backupType: 'manual',
      },
    };
  }
};

export default FunctionHandler(funcManualBackup);
