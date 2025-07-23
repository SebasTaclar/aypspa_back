import { Collection } from 'mongodb';
import { connectMongoClient, mongoClient } from '../../config/MongoClient';
import {
  IRentDataSource,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/interfaces/IRentDataSource';
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

  public async getFinishedRents(
    query?: unknown,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rent>> {
    return this.withCollection(async (collection) => {
      const baseQuery =
        query && typeof query === 'object' ? (query as Record<string, unknown>) : {};
      const filter = { ...baseQuery, isFinished: true };

      // Default pagination values
      const page = pagination?.page || 1;
      const pageSize = pagination?.pageSize || 25;
      const skip = (page - 1) * pageSize;

      // Get total count for pagination metadata
      const totalCount = await collection.countDocuments(filter);

      // Get paginated results
      const rents = await collection
        .find(filter)
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: rents.map(this.mapToRentEntity),
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
      };
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
        isPaid: rent.isPaid || false,
        totalDays: rent.totalDays || null,
        totalPrice: rent.totalPrice || null,
        observations: rent.observations || null,
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

  public async finishRent(
    id: string,
    deliveryDate: string,
    totalDays?: number,
    totalPrice?: number,
    observations?: string,
    isPaid?: boolean
  ): Promise<string | null> {
    return this.withCollection(async (collection) => {
      const updateData: Record<string, unknown> = {
        isFinished: true,
        deliveryDate: deliveryDate,
      };

      if (totalDays !== undefined) updateData.totalDays = totalDays;
      if (totalPrice !== undefined) updateData.totalPrice = totalPrice;
      if (observations !== undefined) updateData.observations = observations;
      if (isPaid !== undefined) updateData.isPaid = isPaid;

      const result = await collection.updateOne({ id }, { $set: updateData });

      return result.modifiedCount > 0 ? id : null;
    });
  }

  private mapToRentEntity(document: Record<string, unknown>): Rent {
    return {
      id: document.id?.toString() || document._id?.toString() || '',
      code: (document.code as string) || '',
      // Frontend compatibility fields (should be populated from joins in real implementation)
      productName: (document.productName as string) || '',
      clientRut: (document.clientRut as string) || '',
      clientName: (document.clientName as string) || '',
      // Core rent data
      quantity: (document.quantity as number) || 0,
      totalValuePerDay: (document.totalValuePerDay as number) || 0,
      deliveryDate: (document.deliveryDate as string) || '',
      paymentMethod: (document.paymentMethod as string) || '',
      warrantyValue: (document.warrantyValue as number) || 0,
      isFinished: (document.isFinished as boolean) || false,
      isPaid: (document.isPaid as boolean) || false,
      totalDays: (document.totalDays as number) || undefined,
      totalPrice: (document.totalPrice as number) || undefined,
      observations: (document.observations as string) || undefined,
      createdAt: document.createdAt
        ? new Date(document.createdAt as string).toISOString()
        : new Date().toISOString(),
      // Internal IDs - in MongoDB implementation, these should come from lookups
      clientId: (document.clientId as number) || 0,
      productId: (document.productId as number) || 0,
    };
  }
}
