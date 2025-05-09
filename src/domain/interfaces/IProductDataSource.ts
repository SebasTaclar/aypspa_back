import { Product } from '../entities/Product';

export interface IProductDataSource {
  getAll(query?: unknown): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(id: string, product: Product): Promise<string | null>;
  delete(id: string): Promise<boolean>;
}
