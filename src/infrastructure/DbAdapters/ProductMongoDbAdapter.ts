import { Collection } from 'mongodb';
import { connectMongoClient, mongoClient } from '../../config/MongoClient';
import { Product } from '../../domain/entities/Product';
import { IProductDataSource } from '../../domain/interfaces/IProductDataSource';

export class ProductMongoDbAdapter implements IProductDataSource {
  private readonly collectionName = 'products';
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

  public async getAll(query?: unknown): Promise<Product[]> {
    const response = this.withCollection(async (collection) => {
      const products = await collection.find(query || {}).toArray();
      return products.map(
        (product) =>
          ({
            id: product.id.toString(),
            name: product.name || '',
            description: product.description || '',
            price: product.price || 0,
            stock: product.stock || 0,
            category: product.category || '',
            createdAt: product.createdAt || null,
            updatedAt: product.updatedAt || null,
          }) as unknown as Product
      );
    });

    return response;
  }

  public async getById(id: string): Promise<Product | null> {
    const response = await this.withCollection(async (collection) => {
      const product = await collection.findOne({ id });
      if (!product) {
        return null;
      }
      return {
        id: product.id.toString(),
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        stock: product.stock || 0,
        category: product.category || '',
        createdAt: product.createdAt || null,
        updatedAt: product.updatedAt || null,
      } as unknown as Product;
    });

    return response;
  }

  public async create(product: Product): Promise<Product> {
    const response = await this.withCollection(async (collection) => {
      const result = await collection.insertOne({
        id: product.id,
        name: product.name,
        code: product.code,
        brand: product.brand,
        priceNet: product.priceNet,
        priceIva: product.priceIva,
        priceTotal: product.priceTotal,
        priceWarranty: product.priceWarranty,
        rented: product.rented,
        createdAt: product.createdAt || new Date(),
      });

      if (!result.acknowledged) {
        throw new Error('Failed to create product');
      }

      return {
        ...product,
        id: result.insertedId.toString(),
      } as Product;
    });

    return response;
  }

  public async update(id: string, product: Product): Promise<string | null> {
    const response = await this.withCollection(async (collection) => {
      const result = await collection.updateOne(
        { id },
        { $set: { ...product, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return null;
      }

      return id;
    });

    return response;
  }

  public async delete(id: string): Promise<boolean> {
    const response = await this.withCollection(async (collection) => {
      const result = await collection.deleteOne({ id });
      return result.deletedCount > 0;
    });

    return response;
  }
}
