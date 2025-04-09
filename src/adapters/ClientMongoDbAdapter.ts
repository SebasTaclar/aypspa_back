import { ObjectId } from 'mongodb';
import { MongoDbAdapter } from './MongoDbAdapter';
import { Client } from '../models/Client';

export class ClientMongoDbAdapter extends MongoDbAdapter {
  private collection: string = 'clients';

  constructor(uri: string, databaseName: string) {
    super(uri, databaseName);
  }

  public static fromEnvironment(): ClientMongoDbAdapter {
    const { uri, databaseName } = this.getEnvironmentConfig();
    return new ClientMongoDbAdapter(uri, databaseName);
  }

  public async create(data: Client): Promise<Client> {
    const database = this.client.db(this.databaseName);
    const result = await database.collection(this.collection).insertOne(data);
    return { ...data, id: result.insertedId.toString() };
  }

  public async read(req: { search?: Record<string, unknown> }): Promise<Client[]> {
    const filter = req.search;
    console.log('Filter:', filter);
    const database = this.client.db(this.databaseName);
    const clients = await database.collection(this.collection).find(filter).toArray();
    return clients.map((client) => ({
      id: client._id.toString(),
      name: client.name || '',
      companyName: client.companyName || '',
      companyDocument: client.companyDocument || '',
      rut: client.rut || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
      creationDate: client.creationDate || null,
      frequentClient: client.frequentClient || '',
      created: client.created || null,
    }));
  }

  public async update(id: string, data: Partial<Client>): Promise<Client | null> {
    const database = this.client.db(this.databaseName);
    const result = await database
      .collection(this.collection)
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: data }, { returnDocument: 'after' });
    return result.value ? { ...result.value, id: result.value._id.toString() } : null;
  }

  public async delete(id: string): Promise<boolean> {
    const database = this.client.db(this.databaseName);
    const result = await database.collection(this.collection).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  // public async getClientById(id: string): Promise<Client | null> {
  //   const clients = await this.read({ _id: new ObjectId(id) });
  //   return clients.length > 0 ? clients[0] : null;
  // }

  public async getAllClients(): Promise<Client[]> {
    return this.read({});
  }
}
