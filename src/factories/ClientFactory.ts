import { ClientMongoDbAdapter } from '../infrastructure/DbAdapters/ClientMongoDbAdapter';
import { ClientService } from '../application/services/ClientService';
import { env_config } from '../config/config';

export async function ClientFactory(log: LogModel): Promise<ClientService> {
  log.logInfo('Creating ClientService instance...');
  const clientRepository = new ClientMongoDbAdapter(env_config.mongoDbDatabase);
  return new ClientService(clientRepository);
}
