import { getPrismaClient } from '../../config/PrismaClient';
import { IClientDataSource } from '../../domain/interfaces/IClientDataSource';
import { Client } from '../../domain/entities/Client';
import { Prisma } from '@prisma/client';

export class ClientPrismaAdapter implements IClientDataSource {
  private readonly prisma = getPrismaClient();

  public async getAll(query?: unknown): Promise<Client[]> {
    let whereClause: Prisma.ClientWhereInput = {};

    // Handle query filtering - LINQ-like Where clause
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      // Build dynamic where clause with partial matching
      whereClause = {
        ...(typeof queryObj.name === 'string' && {
          name: { contains: queryObj.name, mode: 'insensitive' },
        }),
        ...(typeof queryObj.companyName === 'string' && {
          companyName: { contains: queryObj.companyName, mode: 'insensitive' },
        }),
        ...(typeof queryObj.rut === 'string' && { rut: { contains: queryObj.rut } }),
        ...(typeof queryObj.frequentClient !== 'undefined' && {
          frequentClient: queryObj.frequentClient,
        }),
        // Add more conditions as needed
      };
    }

    const clients = await this.prisma.client.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // Similar to LINQ OrderByDescending
    });

    return clients.map((client) => ({
      id: client.id.toString(),
      name: client.name,
      companyName: client.companyName || '',
      companyDocument: client.companyDocument || '',
      rut: client.rut || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
      creationDate: client.creationDate || '',
      frequentClient: client.frequentClient || '',
      created: client.created || '',
      photoFileName: client.photoFileName || undefined,
    }));
  }

  public async getById(id: string): Promise<Client | null> {
    const client = await this.prisma.client.findUnique({
      where: { id: parseInt(id) },
    });

    if (!client) return null;

    return {
      id: client.id.toString(),
      name: client.name,
      companyName: client.companyName || '',
      companyDocument: client.companyDocument || '',
      rut: client.rut || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
      creationDate: client.creationDate || '',
      frequentClient: client.frequentClient || '',
      created: client.created || '',
      photoFileName: client.photoFileName || undefined,
    };
  }

  public async create(client: Client): Promise<Client> {
    const createdClient = await this.prisma.client.create({
      data: {
        name: client.name,
        companyName: client.companyName || null,
        companyDocument: client.companyDocument || null,
        rut: client.rut || null,
        phoneNumber: client.phoneNumber || null,
        address: client.address || null,
        creationDate:
          client.creationDate && client.creationDate.trim() !== ''
            ? client.creationDate
            : new Date().toISOString(),
        frequentClient: client.frequentClient || null,
        created:
          client.created && client.created.trim() !== ''
            ? client.created
            : new Date().toISOString(),
        photoFileName: client.photoFileName || null,
      },
    });

    return {
      id: createdClient.id.toString(),
      name: createdClient.name,
      companyName: createdClient.companyName || '',
      companyDocument: createdClient.companyDocument || '',
      rut: createdClient.rut || '',
      phoneNumber: createdClient.phoneNumber || '',
      address: createdClient.address || '',
      creationDate: createdClient.creationDate || '',
      frequentClient: createdClient.frequentClient || '',
      created: createdClient.created || '',
      photoFileName: createdClient.photoFileName || undefined,
    };
  }

  public async update(id: string, client: Client): Promise<string | null> {
    // Validate and parse the ID
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      console.error(`Invalid client ID: ${id}`);
      return null;
    }

    const updatedClient = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        name: client.name,
        companyName: client.companyName || null,
        companyDocument: client.companyDocument || null,
        rut: client.rut || null,
        phoneNumber: client.phoneNumber || null,
        address: client.address || null,
        creationDate:
          client.creationDate && client.creationDate.trim() !== ''
            ? client.creationDate
            : new Date().toISOString(),
        frequentClient: client.frequentClient || null,
        created:
          client.created && client.created.trim() !== ''
            ? client.created
            : new Date().toISOString(),
        photoFileName: client.photoFileName || null,
      },
      select: { id: true },
    });

    return updatedClient.id.toString();
  }

  public async delete(id: string): Promise<boolean> {
    await this.prisma.client.delete({
      where: { id: parseInt(id) },
    });
    return true;
  }

  // Additional LINQ-like methods
  public async findByRut(rut: string): Promise<Client | null> {
    const client = await this.prisma.client.findFirst({
      where: { rut },
    });

    if (!client) return null;

    return {
      id: client.id.toString(),
      name: client.name,
      companyName: client.companyName || '',
      companyDocument: client.companyDocument || '',
      rut: client.rut || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
      creationDate: client.creationDate || '',
      frequentClient: client.frequentClient || '',
      created: client.created || '',
      photoFileName: client.photoFileName || undefined,
    };
  }

  public async findFrequentClients(): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        frequentClient: { not: null },
      },
      orderBy: { name: 'asc' },
    });

    return clients.map((client) => ({
      id: client.id.toString(),
      name: client.name,
      companyName: client.companyName || '',
      companyDocument: client.companyDocument || '',
      rut: client.rut || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
      creationDate: client.creationDate || '',
      frequentClient: client.frequentClient || '',
      created: client.created || '',
      photoFileName: client.photoFileName || undefined,
    }));
  }

  public async searchByName(searchTerm: string): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    return clients.map((client) => ({
      id: client.id.toString(),
      name: client.name,
      companyName: client.companyName || '',
      companyDocument: client.companyDocument || '',
      rut: client.rut || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
      creationDate: client.creationDate || '',
      frequentClient: client.frequentClient || '',
      created: client.created || '',
      photoFileName: client.photoFileName || undefined,
    }));
  }

  public async count(where?: Prisma.ClientWhereInput): Promise<number> {
    return this.prisma.client.count({ where });
  }
}
