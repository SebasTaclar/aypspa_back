import { ClientMongoDbAdapter } from '../adapters/ClientMongoDbAdapter';
import { ClientService } from '../services/ClientService';

export async function ClientFactory(log: LogModel): Promise<ClientService> {
  log.logInfo('Creating ClientService instance...');
  const dbAdapter: ClientMongoDbAdapter = ClientMongoDbAdapter.fromEnvironment();
  return new ClientService(dbAdapter);
}
