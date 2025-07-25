import { AzureFunction, Context } from '@azure/functions';
import { BackupFactory } from '../src/factories/BackupFactory';
import { Logger } from '../src/shared/Logger';

const funcDailyBackup: AzureFunction = async function (context: Context): Promise<void> {
  const log = new Logger(context.log);

  try {
    // Generate timezone information for logging
    const now = new Date();
    const colombiaTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const chileTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const timezoneInfo = `🕐 Colombia: ${colombiaTime.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })} | Chile: ${chileTime.toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })} | Servidor: ${now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    })}`;

    // Log current schedule configuration and timezone info
    const currentSchedule = process.env.DAILY_BACKUP_SCHEDULE || 'NOT_CONFIGURED';
    log.logInfo(`Daily backup function started with schedule: ${currentSchedule}`);
    log.logInfo(`Execution time - ${timezoneInfo}`);

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
