import { AzureFunction, Context } from '@azure/functions';
import { BackupFactory } from '../src/factories/BackupFactory';
import { Logger } from '../src/shared/Logger';

const funcDailyBackup: AzureFunction = async function (context: Context): Promise<void> {
  const log = new Logger(context.log);

  try {
    // Log current schedule configuration
    const currentSchedule = process.env.DAILY_BACKUP_SCHEDULE || 'NOT_CONFIGURED';
    log.logInfo(`Daily backup function started with schedule: ${currentSchedule}`);

    // Validate schedule is configured
    if (!process.env.DAILY_BACKUP_SCHEDULE) {
      log.logWarning('DAILY_BACKUP_SCHEDULE environment variable is not configured');
    }

    // Initialize backup service using the Logger instance
    const backupService = await BackupFactory(log);

    // Generate daily backup (no custom emails, uses defaults)
    const result = await backupService.generateBackup({
      backupType: 'daily',
    });

    if (result.success && result.data) {
      log.logInfo(
        `Backup sent successfully with ${result.data.summary.totalClients} clients, ${result.data.summary.totalProducts} products, and ${result.data.summary.totalRents} rents`
      );
    } else {
      throw new Error(result.error || 'Backup failed');
    }
  } catch (error) {
    log.logError(
      `Error in daily backup: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    context.res = {
      status: 500,
      body: { error: 'Backup failed' },
    };
  }
};

export = funcDailyBackup;
