import { EmailClient } from '@azure/communication-email';
import { LogModel } from '../domain/entities/LogModel';

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded content - use Buffer.from(content, 'utf8').toString('base64')
  type?: string; // MIME type
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
  log?: LogModel; // Optional log for Azure logging
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const connectionString = process.env.COMMUNICATION_SERVICES_CONNECTION_STRING;
  const fromEmail = process.env.FROM_EMAIL || 'donotreply@aypspa.com';
  const log = options.log;

  if (!connectionString) {
    throw new Error(
      'Azure Communication Services configuration missing - CONNECTION_STRING not configured'
    );
  }

  const logInfo = (message: string) => {
    if (log) {
      log.logInfo(message);
    } else {
      console.log(message);
    }
  };

  const logError = (message: string) => {
    if (log) {
      log.logError(message);
    } else {
      console.error(message);
    }
  };

  logInfo(`🔑 Using Azure Communication Services`);
  logInfo(`📧 From email: ${fromEmail}`);
  logInfo(`📬 To email(s): ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);

  // Create email client
  const emailClient = new EmailClient(connectionString);

  // Prepare attachments for Azure Communication Services
  const attachments = options.attachments?.map((att) => ({
    name: att.filename,
    contentInBase64: att.content,
    contentType: att.type || 'application/json',
  }));

  const emailMessage = {
    senderAddress: fromEmail,
    content: {
      subject: options.subject,
      plainText: options.text,
      html: options.html || options.text,
    },
    recipients: {
      to: [{ address: options.to }],
    },
    attachments: attachments,
  };

  try {
    logInfo('📤 Sending email via Azure Communication Services...');
    const poller = await emailClient.beginSend(emailMessage);

    logInfo('⏳ Waiting for email to be sent...');
    const response = await poller.pollUntilDone();

    logInfo(`✅ Email enviado exitosamente a: ${options.to}`);
    logInfo(`📊 Message ID: ${response.id}`);
    logInfo(`📈 Status: ${response.status}`);
  } catch (error: unknown) {
    logError('❌ Error sending email: ' + JSON.stringify(error));
    if (error instanceof Error && 'code' in error && error.code === 'Unauthorized') {
      logError(
        '🔐 Connection string inválida. Verifica la configuración de Azure Communication Services.'
      );
    }
    throw error;
  }
};
