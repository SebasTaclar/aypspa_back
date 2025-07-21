import { Collection } from 'mongodb';
import { connectMongoClient, mongoClient } from '../../config/MongoClient';
import { IRentDataSource } from '../../domain/interfaces/IRentDataSource';
import { Rent } from '../../domain/entities/Rent';

export class RentMongoDbAdapter implements IRentDataSource {
  private readonly collectionName = 'rents';
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

  public async getAll(query?: unknown): Promise<Rent[]> {
    return this.withCollection(async (collection) => {
      const rents = await collection.find(query || {}).toArray();
      return rents.map(this.mapToRentEntity);
    });
  }

  public async getActiveRents(query?: unknown): Promise<Rent[]> {
    return this.withCollection(async (collection) => {
      const baseQuery =
        query && typeof query === 'object' ? (query as Record<string, unknown>) : {};
      const filter = { ...baseQuery, isFinished: false };
      const rents = await collection.find(filter).toArray();
      return rents.map(this.mapToRentEntity);
    });
  }

  public async getFinishedRents(query?: unknown): Promise<Rent[]> {
    return this.withCollection(async (collection) => {
      const baseQuery =
        query && typeof query === 'object' ? (query as Record<string, unknown>) : {};
      const filter = { ...baseQuery, isFinished: true };
      const rents = await collection.find(filter).toArray();
      return rents.map(this.mapToRentEntity);
    });
  }

  public async getById(id: string): Promise<Rent | null> {
    return this.withCollection(async (collection) => {
      const rent = await collection.findOne({ id });
      return rent ? this.mapToRentEntity(rent) : null;
    });
  }

  public async create(rent: Rent): Promise<Rent> {
    return this.withCollection(async (collection) => {
      const rentDocument = {
        ...rent,
        deliveryDate: rent.deliveryDate || '',
        isFinished: rent.isFinished || false,
      };

      await collection.insertOne(rentDocument);
      return this.mapToRentEntity(rentDocument);
    });
  }

  public async update(id: string, data: Rent): Promise<string | null> {
    return this.withCollection(async (collection) => {
      const result = await collection.updateOne({ id }, { $set: data });

      return result.modifiedCount > 0 ? id : null;
    });
  }

  public async delete(id: string): Promise<{ deletedCount: number }> {
    return this.withCollection(async (collection) => {
      const result = await collection.deleteOne({ id });
      return { deletedCount: result.deletedCount || 0 };
    });
  }

  public async finishRent(id: string, deliveryDate: string): Promise<string | null> {
    return this.withCollection(async (collection) => {
      const result = await collection.updateOne(
        { id },
        {
          $set: {
            isFinished: true,
            deliveryDate: deliveryDate,
          },
        }
      );

      return result.modifiedCount > 0 ? id : null;
    });
  }

  private mapToRentEntity(document: Record<string, unknown>): Rent {
    return {
      id: document.id?.toString() || document._id?.toString() || '',
      code: (document.code as string) || '',
      productName: (document.productName as string) || '',
      quantity: (document.quantity as number) || 0,
      totalValuePerDay: (document.totalValuePerDay as number) || 0,
      clientRut: (document.clientRut as string) || '',
      deliveryDate: (document.deliveryDate as string) || '',
      paymentMethod: (document.paymentMethod as string) || '',
      clientName: (document.clientName as string) || '',
      warrantyValue: (document.warrantyValue as number) || 0,
      isFinished: (document.isFinished as boolean) || false,
      createdAt: document.createdAt
        ? new Date(document.createdAt as string).toISOString()
        : new Date().toISOString(),
    };
  }
}
