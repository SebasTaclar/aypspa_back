import { IProductDataSource } from '../../domain/interfaces/IProductDataSource';
import { Product } from '../../domain/entities/Product';

export class ProductService {
  private readonly productRepository: IProductDataSource;

  constructor(productRepository: IProductDataSource) {
    if (!productRepository) {
      throw new Error('A valid IProductDataSource instance is required.');
    }

    this.productRepository = productRepository;
  }

  public async getAllProducts(query?: unknown): Promise<Product[]> {
    return this.productRepository.getAll(query);
  }

  public async getProductById(id: string): Promise<Product | null> {
    return this.productRepository.getById(id);
  }

  public async createProduct(product: Product): Promise<Product> {
    return this.productRepository.create(product);
  }

  public async updateProduct(id: string, data: Product): Promise<string | null> {
    return this.productRepository.update(id, data);
  }

  public async deleteProduct(id: string): Promise<boolean> {
    return this.productRepository.delete(id);
  }
}
