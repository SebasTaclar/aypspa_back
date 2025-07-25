import { ClientService } from './ClientService';
import { ProductService } from './ProductService';
import { RentService } from './RentService';
import { sendEmail } from '../../shared/emailHelper';
import { LogModel } from '../../domain/entities/LogModel';

// Backup data interface
export interface BackupData {
  timestamp: string;
  clients: unknown[];
  products: unknown[];
  rents: unknown[];
  summary: {
    totalClients: number;
    totalProducts: number;
    totalRents: number;
    activeRents: number;
  };
}

// Backup options interface
export interface BackupOptions {
  customEmails?: string[];
  backupType: 'manual' | 'daily';
}

// Backup result interface
export interface BackupResult {
  success: boolean;
  data?: {
    timestamp: string;
    summary: BackupData['summary'];
    filename: string;
    recipients: string[];
    backupType: string;
  };
  error?: string;
}

export class BackupService {
  constructor(
    private clientService: ClientService,
    private productService: ProductService,
    private rentService: RentService,
    private log: LogModel
  ) {}

  /**
   * Genera información de múltiples zonas horarias
   */
  private getMultiTimezoneInfo(): {
    utc: string;
    colombia: string;
    chile: string;
    server: string;
    formatted: string;
  } {
    const now = new Date();

    // UTC time
    const utcTime = now.toISOString();

    // Calcular horas correctamente usando toLocaleString con timeZone
    const colombiaTime = now.toLocaleString('es-CO', {
      timeZone: 'America/Bogota', // UTC-5
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const chileTime = now.toLocaleString('es-CL', {
      timeZone: 'America/Santiago', // UTC-3 (o UTC-4 en invierno)
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const serverTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });

    return {
      utc: utcTime,
      colombia: colombiaTime,
      chile: chileTime,
      server: serverTime,
      formatted: `🕐 Hora Colombia: ${now.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })} | 🕐 Hora Chile: ${now.toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })} | 🕐 Hora Servidor: ${now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      })}`,
    };
  }

  /**
   * Genera un backup completo del sistema
   */
  async generateBackup(options: BackupOptions): Promise<BackupResult> {
    try {
      this.log.logInfo(`🚀 Iniciando backup ${options.backupType} del sistema AYPSPA`);

      // Get all data
      this.log.logInfo('📊 Extrayendo datos de la base de datos...');

      const [clients, products, allRents] = await Promise.all([
        this.clientService.getAllClients(),
        this.productService.getAllProducts(),
        this.rentService.getAllRents(),
      ]);

      // Count active rents
      const activeRents = allRents.filter((rent) => !rent.isFinished).length;

      // Create backup data with complete mapping
      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        clients: clients.map((client) => ({
          id: client.id,
          name: client.name,
          companyName: client.companyName,
          companyDocument: client.companyDocument,
          rut: client.rut,
          phoneNumber: client.phoneNumber,
          address: client.address,
          frequentClient: client.frequentClient,
          created: client.created,
          creationDate: client.creationDate,
        })),
        products: products.map((product) => ({
          id: product._id,
          name: product.name,
          code: product.code,
          brand: product.brand,
          priceNet: product.priceNet,
          priceIva: product.priceIva,
          priceTotal: product.priceTotal,
          priceWarranty: product.priceWarranty,
          rented: product.rented,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })),
        rents: allRents.map((rent) => ({
          id: rent.id,
          code: rent.code,
          clientName: rent.clientName,
          productName: rent.productName,
          quantity: rent.quantity,
          totalValuePerDay: rent.totalValuePerDay,
          deliveryDate: rent.deliveryDate,
          warrantyValue: rent.warrantyValue,
          warrantyType: rent.warrantyType,
          isFinished: rent.isFinished,
          isPaid: rent.isPaid,
          totalDays: rent.totalDays,
          totalPrice: rent.totalPrice,
          createdAt: rent.createdAt,
        })),
        summary: {
          totalClients: clients.length,
          totalProducts: products.length,
          totalRents: allRents.length,
          activeRents: activeRents,
        },
      };

      this.log.logInfo(
        `✅ Datos extraídos: ${backupData.summary.totalClients} clientes, ${backupData.summary.totalProducts} productos, ${backupData.summary.totalRents} arriendos (${backupData.summary.activeRents} activos)`
      );

      // Generate filename and send email
      const result = await this.sendBackupEmail(backupData, options);

      this.log.logInfo(`✅ Backup ${options.backupType} completado exitosamente`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.log.logError(`❌ Error durante el backup ${options.backupType}: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Envía el backup por email
   */
  private async sendBackupEmail(
    backupData: BackupData,
    options: BackupOptions
  ): Promise<{
    timestamp: string;
    summary: BackupData['summary'];
    filename: string;
    recipients: string[];
    backupType: string;
  }> {
    // Convert to JSON
    const backupJson = JSON.stringify(backupData, null, 2);

    // Get timezone information
    const timezoneInfo = this.getMultiTimezoneInfo();

    // Create filename with Chilean time for consistency
    const now = new Date();
    const chileanTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // UTC-3 for Chile
    const filename = `AYPSPA_${options.backupType === 'manual' ? 'ManualBackup' : 'Backup'}_${chileanTime.toISOString().split('T')[0]}_${chileanTime.getHours()}-${chileanTime.getMinutes()}.json`;

    // Get recipients
    const recipients = this.getEmailRecipients(options.customEmails);

    // Validar que hay al menos un email válido
    if (!recipients || recipients.length === 0) {
      throw new Error(
        'No hay destinatarios de email configurados. Verifica BACKUP_EMAIL_RECIPIENTS en las variables de entorno.'
      );
    }

    this.log.logInfo(`📧 Enviando backup ${options.backupType} por email...`);
    this.log.logInfo(`${timezoneInfo.formatted}`);

    // Convert JSON to base64 for Azure Communication Services
    const backupJsonBase64 = Buffer.from(backupJson, 'utf8').toString('base64');

    // Prepare email content based on backup type with timezone information
    const subject =
      options.backupType === 'manual'
        ? `AYPSPA - Backup Manual - ${timezoneInfo.chile.split(' ')[0]}`
        : `AYPSPA - Backup Diario - ${timezoneInfo.chile.split(' ')[0]}`;

    const bodyText =
      options.backupType === 'manual'
        ? `Backup manual del sistema AYPSPA\n\n${timezoneInfo.formatted}\n\nEste backup fue solicitado manualmente y contiene toda la información actual del sistema.\n\nResumen:\n- ${backupData.summary.totalClients} clientes\n- ${backupData.summary.totalProducts} productos\n- ${backupData.summary.totalRents} arriendos (${backupData.summary.activeRents} activos)\n\nEl archivo adjunto contiene todos los datos en formato JSON para recuperación o análisis.`
        : `Backup automático del sistema AYPSPA\n\n${timezoneInfo.formatted}\n\nResumen:\n- ${backupData.summary.totalClients} clientes\n- ${backupData.summary.totalProducts} productos\n- ${backupData.summary.totalRents} arriendos (${backupData.summary.activeRents} activos)`;

    // Send email to each recipient individually
    for (const recipient of recipients) {
      await sendEmail({
        to: recipient.trim(),
        subject: subject,
        text: bodyText,
        log: this.log, // Pass log to email service
        attachments: [
          {
            filename: filename,
            content: backupJsonBase64,
            type: 'application/json',
          },
        ],
      });
    }

    this.log.logInfo(
      `✅ Backup ${options.backupType} enviado exitosamente a: ${recipients.join(', ')}`
    );

    return {
      timestamp: backupData.timestamp,
      summary: backupData.summary,
      filename: filename,
      recipients: recipients,
      backupType: options.backupType,
    };
  }

  /**
   * Obtiene la lista de destinatarios de email
   */
  private getEmailRecipients(customEmails?: string[]): string[] {
    // Correos por defecto del environment
    const defaultRecipients =
      process.env.BACKUP_EMAIL_RECIPIENTS?.split(',').map((email) => email.trim()) || [];

    if (customEmails && Array.isArray(customEmails) && customEmails.length > 0) {
      // Filtrar correos válidos del parámetro
      const validCustomEmails = customEmails
        .filter((email) => email && email.trim() !== '')
        .map((email) => email.trim());

      // Combinar correos personalizados con los por defecto, evitando duplicados
      const allEmails = [...validCustomEmails, ...defaultRecipients];
      const recipients = Array.from(new Set(allEmails)); // Eliminar duplicados

      this.log.logInfo(
        `📧 Usando correos combinados (${validCustomEmails.length} personalizados + ${defaultRecipients.length} por defecto): ${recipients.join(', ')}`
      );

      return recipients;
    } else {
      // Solo usar correos por defecto si no hay personalizados
      this.log.logInfo(`📧 Usando correos por defecto: ${defaultRecipients.join(', ')}`);
      return defaultRecipients;
    }
  }
}
