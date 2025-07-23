import { getPrismaClient } from '../../config/PrismaClient';
import {
  IRentDataSource,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/interfaces/IRentDataSource';
import { Rent } from '../../domain/entities/Rent';
import {
  Prisma,
  Rent as PrismaRent,
  Client as PrismaClient,
  Product as PrismaProduct,
} from '@prisma/client';

export class RentPrismaAdapter implements IRentDataSource {
  private readonly prisma = getPrismaClient();

  public async getAll(query?: unknown): Promise<Rent[]> {
    let whereClause: Prisma.RentWhereInput = {};

    // Handle query filtering - LINQ-like Where clause
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      // Build all filters separately
      const allFilters: any[] = [];

      // Product filters (code OR name)
      const productFilters: any[] = [];
      if (typeof queryObj.code === 'string') {
        productFilters.push({ code: { contains: queryObj.code, mode: 'insensitive' } });
      }
      if (typeof queryObj.productName === 'string') {
        productFilters.push({ name: { contains: queryObj.productName, mode: 'insensitive' } });
      }

      if (productFilters.length > 0) {
        allFilters.push({
          product: productFilters.length === 1 ? productFilters[0] : { OR: productFilters },
        });
      }

      // Client filters
      if (typeof queryObj.clientName === 'string') {
        allFilters.push({
          client: {
            name: { contains: queryObj.clientName, mode: 'insensitive' },
          },
        });
      }

      if (typeof queryObj.clientRut === 'string') {
        allFilters.push({
          client: {
            rut: { contains: queryObj.clientRut },
          },
        });
      }

      // Other filters (these use AND as they are different criteria)
      const otherFilters: any = {};
      if (typeof queryObj.isFinished === 'boolean') {
        otherFilters.isFinished = queryObj.isFinished;
      }
      if (typeof queryObj.paymentMethod === 'string') {
        otherFilters.paymentMethod = queryObj.paymentMethod;
      }
      if (typeof queryObj.startDate === 'string') {
        otherFilters.createdAt = { ...otherFilters.createdAt, gte: new Date(queryObj.startDate) };
      }
      if (typeof queryObj.endDate === 'string') {
        otherFilters.createdAt = { ...otherFilters.createdAt, lte: new Date(queryObj.endDate) };
      }

      // Build dynamic where clause
      if (allFilters.length > 0) {
        whereClause = {
          ...otherFilters,
          ...(allFilters.length === 1 ? allFilters[0] : { OR: allFilters }),
        };
      } else {
        whereClause = otherFilters;
      }
    }

    const rents = await this.prisma.rent.findMany({
      where: whereClause,
      include: {
        client: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' }, // Similar to LINQ OrderByDescending
    });

    return rents.map(this.mapToRentEntity);
  }

  public async getActiveRents(query?: unknown): Promise<Rent[]> {
    let whereClause: Prisma.RentWhereInput = { isFinished: false };

    // Handle additional query filtering for active rents
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      // Build all filters separately
      const allFilters: any[] = [];

      // Product filters (code OR name)
      const productFilters: any[] = [];
      if (typeof queryObj.code === 'string' && queryObj.code.trim() !== '') {
        productFilters.push({ code: { contains: queryObj.code, mode: 'insensitive' } });
      }
      if (typeof queryObj.productName === 'string' && queryObj.productName.trim() !== '') {
        productFilters.push({ name: { contains: queryObj.productName, mode: 'insensitive' } });
      }

      if (productFilters.length > 0) {
        allFilters.push({
          product: productFilters.length === 1 ? productFilters[0] : { OR: productFilters },
        });
      }

      // Client filters
      if (typeof queryObj.clientName === 'string' && queryObj.clientName.trim() !== '') {
        allFilters.push({
          client: {
            name: { contains: queryObj.clientName, mode: 'insensitive' },
          },
        });
      }

      if (typeof queryObj.clientRut === 'string' && queryObj.clientRut.trim() !== '') {
        allFilters.push({
          client: {
            rut: { contains: queryObj.clientRut },
          },
        });
      }

      // If we have multiple filter types, use OR between them
      if (allFilters.length > 0) {
        whereClause = {
          ...whereClause,
          ...(allFilters.length === 1 ? allFilters[0] : { OR: allFilters }),
        };
      }
    }

    const rents = await this.prisma.rent.findMany({
      where: whereClause,
      include: {
        client: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rents.map(this.mapToRentEntity);
  }

  public async getFinishedRents(
    query?: unknown,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rent>> {
    let whereClause: Prisma.RentWhereInput = { isFinished: true };

    // Handle additional query filtering for finished rents
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      // Build all filters separately
      const allFilters: any[] = [];

      // Product filters (code OR name)
      const productFilters: any[] = [];
      if (typeof queryObj.code === 'string') {
        productFilters.push({ code: { contains: queryObj.code, mode: 'insensitive' } });
      }
      if (typeof queryObj.productName === 'string') {
        productFilters.push({ name: { contains: queryObj.productName, mode: 'insensitive' } });
      }

      if (productFilters.length > 0) {
        allFilters.push({
          product: productFilters.length === 1 ? productFilters[0] : { OR: productFilters },
        });
      }

      // Client filters
      if (typeof queryObj.clientName === 'string') {
        allFilters.push({
          client: {
            name: { contains: queryObj.clientName, mode: 'insensitive' },
          },
        });
      }

      if (typeof queryObj.clientRut === 'string') {
        allFilters.push({
          client: {
            rut: { contains: queryObj.clientRut },
          },
        });
      }

      // Other filters that should remain AND
      const otherFilters: any = {};
      if (typeof queryObj.startDate === 'string') {
        otherFilters.createdAt = { ...otherFilters.createdAt, gte: new Date(queryObj.startDate) };
      }
      if (typeof queryObj.endDate === 'string') {
        otherFilters.createdAt = { ...otherFilters.createdAt, lte: new Date(queryObj.endDate) };
      }
      if (typeof queryObj.isPaid === 'boolean') {
        otherFilters.isPaid = queryObj.isPaid;
      }

      // Build where clause
      if (allFilters.length > 0) {
        whereClause = {
          ...whereClause,
          ...otherFilters,
          ...(allFilters.length === 1 ? allFilters[0] : { OR: allFilters }),
        };
      } else {
        whereClause = { ...whereClause, ...otherFilters };
      }
    }

    // Default pagination values
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 25;
    const skip = (page - 1) * pageSize;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.rent.count({
      where: whereClause,
    });

    // Get paginated results with joins
    const rents = await this.prisma.rent.findMany({
      where: whereClause,
      include: {
        client: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: rents.map(this.mapToRentEntity),
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    };
  }

  public async getById(id: string): Promise<Rent | null> {
    try {
      const rentId = parseInt(id, 10);
      if (isNaN(rentId)) {
        return null;
      }

      const rent = await this.prisma.rent.findUnique({
        where: { id: rentId },
        include: {
          client: true,
          product: true,
        },
      });

      return rent ? this.mapToRentEntity(rent) : null;
    } catch (error) {
      console.error('Error getting rent by ID:', error);
      return null;
    }
  }

  public async create(rent: Rent): Promise<Rent> {
    try {
      const createdRent = await this.prisma.rent.create({
        data: {
          quantity: rent.quantity,
          deliveryDate: rent.deliveryDate || '',
          paymentMethod: rent.paymentMethod,
          warrantyValue: rent.warrantyValue,
          isFinished: rent.isFinished || false,
          isPaid: rent.isPaid || false,
          totalDays: rent.totalDays || null,
          totalPrice: rent.totalPrice || null,
          observations: rent.observations || null,
          clientId: rent.clientId,
          productId: rent.productId,
        },
        include: {
          client: true,
          product: true,
        },
      });

      return this.mapToRentEntity(createdRent);
    } catch (error: unknown) {
      console.error('Error creating rent:', error);
      throw new Error('Failed to create rent');
    }
  }

  public async update(id: string, data: Rent): Promise<string | null> {
    try {
      const rentId = parseInt(id, 10);
      if (isNaN(rentId)) {
        return null;
      }

      const updatedRent = await this.prisma.rent.update({
        where: { id: rentId },
        data: {
          quantity: data.quantity,
          deliveryDate: data.deliveryDate,
          paymentMethod: data.paymentMethod,
          warrantyValue: data.warrantyValue,
          isFinished: data.isFinished,
          isPaid: data.isPaid,
          totalDays: data.totalDays || null,
          totalPrice: data.totalPrice || null,
          observations: data.observations || null,
          clientId: data.clientId,
          productId: data.productId,
        },
      });

      return updatedRent.id.toString();
    } catch (error) {
      console.error('Error updating rent:', error);
      return null;
    }
  }

  public async delete(id: string): Promise<{ deletedCount: number }> {
    try {
      const rentId = parseInt(id, 10);
      if (isNaN(rentId)) {
        return { deletedCount: 0 };
      }

      await this.prisma.rent.delete({
        where: { id: rentId },
      });

      return { deletedCount: 1 };
    } catch (error) {
      console.error('Error deleting rent:', error);
      return { deletedCount: 0 };
    }
  }

  public async finishRent(
    id: string,
    deliveryDate: string,
    totalDays?: number,
    totalPrice?: number,
    observations?: string,
    isPaid?: boolean
  ): Promise<string | null> {
    try {
      const rentId = parseInt(id, 10);
      if (isNaN(rentId)) {
        return null;
      }

      const updatedRent = await this.prisma.rent.update({
        where: { id: rentId },
        data: {
          isFinished: true,
          deliveryDate: deliveryDate,
          ...(totalDays !== undefined && { totalDays }),
          ...(totalPrice !== undefined && { totalPrice }),
          ...(observations !== undefined && { observations }),
          ...(isPaid !== undefined && { isPaid }),
        },
      });

      return updatedRent.id.toString();
    } catch (error) {
      console.error('Error finishing rent:', error);
      return null;
    }
  }

  private mapToRentEntity(
    rent: PrismaRent & { client: PrismaClient; product: PrismaProduct }
  ): Rent {
    return {
      id: rent.id.toString(),
      code: rent.product.code, // Get code from product join
      // Data from joins (for frontend compatibility)
      productName: rent.product.name,
      clientRut: rent.client.rut || '',
      clientName: rent.client.name,
      // Core rent data
      quantity: rent.quantity,
      totalValuePerDay: Number(rent.product.priceTotal), // Get from product instead of denormalized field
      deliveryDate: rent.deliveryDate || '',
      paymentMethod: rent.paymentMethod,
      warrantyValue: Number(rent.warrantyValue),
      isFinished: rent.isFinished,
      isPaid: rent.isPaid,
      totalDays: rent.totalDays ? Number(rent.totalDays) : undefined,
      totalPrice: rent.totalPrice ? Number(rent.totalPrice) : undefined,
      observations: rent.observations || undefined,
      createdAt: rent.createdAt.toISOString(),
      // Internal IDs for operations
      clientId: rent.clientId,
      productId: rent.productId,
    };
  }
}
