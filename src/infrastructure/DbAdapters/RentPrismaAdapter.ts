import { getPrismaClient } from '../../config/PrismaClient';
import { IRentDataSource } from '../../domain/interfaces/IRentDataSource';
import { Rent } from '../../domain/entities/Rent';
import { Prisma, Rent as PrismaRent } from '@prisma/client';

export class RentPrismaAdapter implements IRentDataSource {
  private readonly prisma = getPrismaClient();

  public async getAll(query?: unknown): Promise<Rent[]> {
    let whereClause: Prisma.RentWhereInput = {};

    // Handle query filtering - LINQ-like Where clause
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      // Build dynamic where clause with partial matching
      whereClause = {
        ...(typeof queryObj.code === 'string' && {
          code: { contains: queryObj.code, mode: 'insensitive' },
        }),
        ...(typeof queryObj.productName === 'string' && {
          productName: { contains: queryObj.productName, mode: 'insensitive' },
        }),
        ...(typeof queryObj.clientName === 'string' && {
          clientName: { contains: queryObj.clientName, mode: 'insensitive' },
        }),
        ...(typeof queryObj.clientRut === 'string' && {
          clientRut: { contains: queryObj.clientRut },
        }),
        ...(typeof queryObj.isFinished === 'boolean' && {
          isFinished: queryObj.isFinished,
        }),
        ...(typeof queryObj.paymentMethod === 'string' && {
          paymentMethod: queryObj.paymentMethod,
        }),
        // Date range filtering
        ...(typeof queryObj.startDate === 'string' && {
          creationDate: { gte: queryObj.startDate },
        }),
        ...(typeof queryObj.endDate === 'string' && {
          creationDate: { lte: queryObj.endDate },
        }),
      };
    }

    const rents = await this.prisma.rent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // Similar to LINQ OrderByDescending
    });

    return rents.map(this.mapToRentEntity);
  }

  public async getActiveRents(query?: unknown): Promise<Rent[]> {
    let whereClause: Prisma.RentWhereInput = { isFinished: false };

    // Handle additional query filtering for active rents
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      whereClause = {
        ...whereClause,
        ...(typeof queryObj.code === 'string' && {
          code: { contains: queryObj.code, mode: 'insensitive' },
        }),
        ...(typeof queryObj.productName === 'string' && {
          productName: { contains: queryObj.productName, mode: 'insensitive' },
        }),
        ...(typeof queryObj.clientName === 'string' && {
          clientName: { contains: queryObj.clientName, mode: 'insensitive' },
        }),
        ...(typeof queryObj.clientRut === 'string' && {
          clientRut: { contains: queryObj.clientRut },
        }),
      };
    }

    const rents = await this.prisma.rent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return rents.map(this.mapToRentEntity);
  }

  public async getFinishedRents(query?: unknown): Promise<Rent[]> {
    let whereClause: Prisma.RentWhereInput = { isFinished: true };

    // Handle additional query filtering for finished rents
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      whereClause = {
        ...whereClause,
        ...(typeof queryObj.code === 'string' && {
          code: { contains: queryObj.code, mode: 'insensitive' },
        }),
        ...(typeof queryObj.productName === 'string' && {
          productName: { contains: queryObj.productName, mode: 'insensitive' },
        }),
        ...(typeof queryObj.clientName === 'string' && {
          clientName: { contains: queryObj.clientName, mode: 'insensitive' },
        }),
        ...(typeof queryObj.clientRut === 'string' && {
          clientRut: { contains: queryObj.clientRut },
        }),
      };
    }

    const rents = await this.prisma.rent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return rents.map(this.mapToRentEntity);
  }

  public async getById(id: string): Promise<Rent | null> {
    try {
      const rentId = parseInt(id, 10);
      if (isNaN(rentId)) {
        return null;
      }

      const rent = await this.prisma.rent.findUnique({
        where: { id: rentId },
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
          code: rent.code,
          productName: rent.productName,
          quantity: rent.quantity,
          totalValuePerDay: rent.totalValuePerDay,
          clientRut: rent.clientRut,
          deliveryDate: rent.deliveryDate || '',
          paymentMethod: rent.paymentMethod,
          clientName: rent.clientName,
          warrantyValue: rent.warrantyValue,
          creationDate: rent.creationDate || new Date().toISOString(),
          isFinished: rent.isFinished || false,
        },
      });

      return this.mapToRentEntity(createdRent);
    } catch (error: unknown) {
      console.error('Error creating rent:', error);

      // Handle unique constraint violation for code field
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes('code')
      ) {
        throw new Error(
          `A rent with code '${rent.code}' already exists. Please use a different code.`
        );
      }

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
          code: data.code,
          productName: data.productName,
          quantity: data.quantity,
          totalValuePerDay: data.totalValuePerDay,
          clientRut: data.clientRut,
          deliveryDate: data.deliveryDate,
          paymentMethod: data.paymentMethod,
          clientName: data.clientName,
          warrantyValue: data.warrantyValue,
          creationDate: data.creationDate,
          isFinished: data.isFinished,
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

  public async finishRent(id: string, deliveryDate: string): Promise<string | null> {
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
        },
      });

      return updatedRent.id.toString();
    } catch (error) {
      console.error('Error finishing rent:', error);
      return null;
    }
  }

  private mapToRentEntity(rent: PrismaRent): Rent {
    return {
      id: rent.id.toString(),
      code: rent.code,
      productName: rent.productName,
      quantity: rent.quantity,
      totalValuePerDay: Number(rent.totalValuePerDay),
      clientRut: rent.clientRut,
      deliveryDate: rent.deliveryDate || '',
      paymentMethod: rent.paymentMethod,
      clientName: rent.clientName,
      warrantyValue: Number(rent.warrantyValue),
      creationDate: rent.creationDate,
      isFinished: rent.isFinished,
    };
  }
}
