import { ClientMongoDbAdapter } from '../adapters/ClientMongoDbAdapter';
import { Client } from '../models/Client';

export class ClientService {
  private dbAdapter: ClientMongoDbAdapter;

  constructor(dbAdapter: ClientMongoDbAdapter) {
    if (!dbAdapter) {
      throw new Error('A valid MongoDbAdapter instance is required.');
    }

    this.dbAdapter = dbAdapter;
  }

  public async getAllClients(req: unknown): Promise<Client[]> {
    return await this.dbAdapter.read(req);
  }
}
