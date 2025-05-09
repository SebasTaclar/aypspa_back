import { Product } from '../../domain/entities/Product';

export class ProductDto {
  id: string;
  name: string;
  code: string;
  brand: string;
  priceNet: number;
  priceIva: number;
  priceTotal: number;
  priceWarranty: number;
  rented: boolean;
  createdAt: string;
  updatedAt: string | null;

  public static toEntity(productDto: ProductDto): Product {
    return {
      id: productDto.id,
      name: productDto.name,
      code: productDto.code,
      brand: productDto.brand,
      priceNet: productDto.priceNet,
      priceIva: productDto.priceIva,
      priceTotal: productDto.priceTotal,
      priceWarranty: productDto.priceWarranty,
      rented: productDto.rented,
      createdAt: new Date(productDto.createdAt).toISOString(),
      updatedAt: productDto.updatedAt ? new Date(productDto.updatedAt).toISOString() : null,
    };
  }
}
