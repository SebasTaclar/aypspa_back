import { getPrismaClient } from '../../config/PrismaClient';
import { IProductDataSource } from '../../domain/interfaces/IProductDataSource';
import { Product } from '../../domain/entities/Product';
import { Prisma } from '@prisma/client';

export class ProductPrismaAdapter implements IProductDataSource {
  private readonly prisma = getPrismaClient();

  public async getAll(query?: unknown): Promise<Product[]> {
    let whereClause: Prisma.ProductWhereInput = {};

    // Handle query filtering - LINQ-like Where clause
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      // Build dynamic where clause
      whereClause = {
        ...(typeof queryObj.name === 'string' && {
          name: { contains: queryObj.name, mode: 'insensitive' },
        }),
        ...(typeof queryObj.code === 'string' && {
          code: { contains: queryObj.code, mode: 'insensitive' },
        }),
        ...(typeof queryObj.brand === 'string' && {
          brand: { contains: queryObj.brand, mode: 'insensitive' },
        }),
        ...(typeof queryObj.rented === 'boolean' && { rented: queryObj.rented }),
        // Price range filtering
        ...(typeof queryObj.minPrice === 'number' && {
          priceTotal: { gte: new Prisma.Decimal(queryObj.minPrice) },
        }),
        ...(typeof queryObj.maxPrice === 'number' && {
          priceTotal: { lte: new Prisma.Decimal(queryObj.maxPrice) },
        }),
      };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // Similar to LINQ OrderByDescending
    });

    return products.map((product) => ({
      _id: product.id.toString(),
      name: product.name,
      code: product.code,
      brand: product.brand || '',
      priceNet: Number(product.priceNet),
      priceIva: Number(product.priceIva),
      priceTotal: Number(product.priceTotal),
      priceWarranty: Number(product.priceWarranty),
      rented: product.rented,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
    }));
  }

  public async getById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) return null;

    return {
      _id: product.id.toString(),
      name: product.name,
      code: product.code,
      brand: product.brand || '',
      priceNet: Number(product.priceNet),
      priceIva: Number(product.priceIva),
      priceTotal: Number(product.priceTotal),
      priceWarranty: Number(product.priceWarranty),
      rented: product.rented,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
    };
  }

  public async create(product: Product): Promise<Product> {
    const createdProduct = await this.prisma.product.create({
      data: {
        name: product.name,
        code: product.code,
        brand: product.brand || null,
        priceNet: new Prisma.Decimal(product.priceNet),
        priceIva: new Prisma.Decimal(product.priceIva),
        priceTotal: new Prisma.Decimal(product.priceTotal),
        priceWarranty: new Prisma.Decimal(product.priceWarranty),
        rented: product.rented,
      },
    });

    return {
      _id: createdProduct.id.toString(),
      name: createdProduct.name,
      code: createdProduct.code,
      brand: createdProduct.brand || '',
      priceNet: Number(createdProduct.priceNet),
      priceIva: Number(createdProduct.priceIva),
      priceTotal: Number(createdProduct.priceTotal),
      priceWarranty: Number(createdProduct.priceWarranty),
      rented: createdProduct.rented,
      createdAt: createdProduct.createdAt.toISOString(),
      updatedAt: createdProduct.updatedAt?.toISOString() || null,
    };
  }

  public async update(id: string, product: Product): Promise<string | null> {
    const updatedProduct = await this.prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: product.name,
        code: product.code,
        brand: product.brand || null,
        priceNet: new Prisma.Decimal(product.priceNet),
        priceIva: new Prisma.Decimal(product.priceIva),
        priceTotal: new Prisma.Decimal(product.priceTotal),
        priceWarranty: new Prisma.Decimal(product.priceWarranty),
        rented: product.rented,
      },
      select: { id: true },
    });

    return updatedProduct.id.toString();
  }

  public async delete(id: string): Promise<boolean> {
    await this.prisma.product.delete({
      where: { id: parseInt(id) },
    });
    return true;
  }

  // Additional LINQ-like methods
  public async findByCode(code: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { code },
    });

    if (!product) return null;

    return {
      _id: product.id.toString(),
      name: product.name,
      code: product.code,
      brand: product.brand || '',
      priceNet: Number(product.priceNet),
      priceIva: Number(product.priceIva),
      priceTotal: Number(product.priceTotal),
      priceWarranty: Number(product.priceWarranty),
      rented: product.rented,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
    };
  }

  public async findByBrand(brand: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { brand: { contains: brand, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      _id: product.id.toString(),
      name: product.name,
      code: product.code,
      brand: product.brand || '',
      priceNet: Number(product.priceNet),
      priceIva: Number(product.priceIva),
      priceTotal: Number(product.priceTotal),
      priceWarranty: Number(product.priceWarranty),
      rented: product.rented,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
    }));
  }

  public async findRentedProducts(): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { rented: true },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      _id: product.id.toString(),
      name: product.name,
      code: product.code,
      brand: product.brand || '',
      priceNet: Number(product.priceNet),
      priceIva: Number(product.priceIva),
      priceTotal: Number(product.priceTotal),
      priceWarranty: Number(product.priceWarranty),
      rented: product.rented,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
    }));
  }

  public async findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        priceTotal: {
          gte: new Prisma.Decimal(minPrice),
          lte: new Prisma.Decimal(maxPrice),
        },
      },
      orderBy: { priceTotal: 'asc' },
    });

    return products.map((product) => ({
      _id: product.id.toString(),
      name: product.name,
      code: product.code,
      brand: product.brand || '',
      priceNet: Number(product.priceNet),
      priceIva: Number(product.priceIva),
      priceTotal: Number(product.priceTotal),
      priceWarranty: Number(product.priceWarranty),
      rented: product.rented,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
    }));
  }

  public async searchByNameOrCode(searchTerm: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { code: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      _id: product.id.toString(),
      name: product.name,
      code: product.code,
      brand: product.brand || '',
      priceNet: Number(product.priceNet),
      priceIva: Number(product.priceIva),
      priceTotal: Number(product.priceTotal),
      priceWarranty: Number(product.priceWarranty),
      rented: product.rented,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() || null,
    }));
  }

  public async count(where?: Prisma.ProductWhereInput): Promise<number> {
    return this.prisma.product.count({ where });
  }

  public async getAveragePrice(): Promise<number> {
    const result = await this.prisma.product.aggregate({
      _avg: {
        priceTotal: true,
      },
    });

    return Number(result._avg.priceTotal) || 0;
  }
}
