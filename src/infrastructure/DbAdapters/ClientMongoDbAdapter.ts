import { Collection } from 'mongodb';
import { connectMongoClient, mongoClient } from '../../config/MongoClient';
import { IClientDataSource } from '../../domain/interfaces/IClientDataSource';
import { Client } from '../../domain/entities/Client';

export class ClientMongoDbAdapter implements IClientDataSource {
  private readonly collectionName = 'clients';
  private readonly databaseName: string;

  constructor(databaseName: string) {
    this.databaseName = databaseName;
  }

  private async getCollection(): Promise<Collection> {
    await connectMongoClient();
    const database = mongoClient.db(this.databaseName);
    return database.collection(this.collectionName);
  }

  private async withCollection<T>(callback: (collection: Collection) => Promise<T>): Promise<T> {
    const collection = await this.getCollection();
    return callback(collection);
  }

  public async getAll(query?: unknown): Promise<Client[]> {
    const response = this.withCollection(async (collection) => {
      const clients = await collection.find(query || {}).toArray();
      return clients.map(
        (client) =>
          ({
            id: client.id.toString(),
            name: client.name || '',
            companyName: client.companyName || '',
            companyDocument: client.companyDocument || '',
            rut: client.rut || '',
            phoneNumber: client.phoneNumber || '',
            address: client.address || '',
            creationDate: client.creationDate || null,
            frequentClient: client.frequentClient || '',
            created: client.created || null,
            photoFileName: client.photoFileName || undefined,
          }) as Client
      );
    });

    return response;
  }

  public async getById(id: string): Promise<Client | null> {
    const response = this.withCollection(async (collection) => {
      const client = await collection.findOne({ id });
      if (!client) return null;
      return {
        id: client.id.toString(),
        name: client.name || '',
        companyName: client.companyName || '',
        companyDocument: client.companyDocument || '',
        rut: client.rut || '',
        phoneNumber: client.phoneNumber || '',
        address: client.address || '',
        creationDate: client.creationDate || null,
        frequentClient: client.frequentClient || '',
        created: client.created || null,
        photoFileName: client.photoFileName || undefined,
      } as Client;
    });

    return response;
  }

  public async create(data: Client): Promise<Client> {
    const response = this.withCollection(async (collection) => {
      // Generate a new ID if not provided or if it's empty
      const clientToInsert = {
        ...data,
        id:
          data.id && data.id.trim() !== '' ? data.id : Math.floor(Math.random() * 10000).toString(),
      };

      await collection.insertOne(clientToInsert);
      return clientToInsert;
    });

    return response;
  }

  public async update(id: string, data: Client): Promise<string | null> {
    const response = this.withCollection(async (collection) => {
      const result = await collection.findOneAndUpdate(
        { id },
        { $set: data },
        { returnDocument: 'after' }
      );
      console.log('result', result);
      return result ? result.id.toString() : null;
    });

    return response;
  }

  public async delete(id: string): Promise<boolean> {
    const response = this.withCollection(async (collection) => {
      const result = await collection.deleteOne({ id });
      return result.deletedCount === 1;
    });

    return response;
  }
}
