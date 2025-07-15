import { ClientMongoDbAdapter } from '../infrastructure/DbAdapters/ClientMongoDbAdapter';
import { ClientPrismaAdapter } from '../infrastructure/DbAdapters/ClientPrismaAdapter';
import { ClientService } from '../application/services/ClientService';
import { env_config } from '../config/config';
import { LogModel } from '../domain/entities/LogModel';

export async function ClientFactory(log: LogModel): Promise<ClientService> {
  log.logInfo('Creating ClientService instance...');

  let clientRepository;

  if (env_config.databaseType === 'prisma') {
    clientRepository = new ClientPrismaAdapter();
  } else {
    clientRepository = new ClientMongoDbAdapter(env_config.mongoDbDatabase);
  }

  return new ClientService(clientRepository);
}
