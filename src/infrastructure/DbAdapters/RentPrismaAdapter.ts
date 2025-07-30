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

  /**
   * Construye filtros de búsqueda reutilizables
   * @param queryObj - Objeto con los parámetros de búsqueda
   * @returns Objeto con whereClause y logs de debug
   */
  private buildSearchFilters(queryObj: Record<string, unknown>): {
    whereClause: Record<string, unknown>;
    debugInfo: string[];
  } {
    const searchFilters: unknown[] = [];
    const debugInfo: string[] = [];

    // Product search filters - estas trabajan como criterios de búsqueda separados
    if (typeof queryObj.code === 'string' && queryObj.code.trim() !== '') {
      const codeWords = queryObj.code.trim().split(/\s+/);
      debugInfo.push(`📝 Código - Palabras encontradas: ${JSON.stringify(codeWords)}`);

      const codeWordFilters = codeWords.map((word) => ({
        product: { code: { contains: word, mode: 'insensitive' } },
      }));
      const codeFilter =
        codeWordFilters.length === 1 ? codeWordFilters[0] : { OR: codeWordFilters };
      searchFilters.push(codeFilter);
      debugInfo.push(`🔧 Filtro de código generado: ${JSON.stringify(codeFilter, null, 2)}`);
    }

    if (typeof queryObj.productName === 'string' && queryObj.productName.trim() !== '') {
      const nameWords = queryObj.productName.trim().split(/\s+/);
      debugInfo.push(`📝 Producto - Palabras encontradas: ${JSON.stringify(nameWords)}`);

      // CAMBIO: Usar AND Logic - Busca nombres de productos que contengan TODAS las palabras
      // Ejemplo: "mesa vidrio" solo encuentra productos que tengan AMBAS palabras en su nombre
      // "MESA DE VIDRIO TEMPLADO" ✅ (contiene "mesa" Y "vidrio")
      // "MESA DE MADERA" ❌ (contiene "mesa" pero NO "vidrio")
      // "VIDRIO DECORATIVO" ❌ (contiene "vidrio" pero NO "mesa")

      const productNameFilterAND = {
        AND: nameWords.map((word) => ({
          product: { name: { contains: word, mode: 'insensitive' } },
        })),
      };

      searchFilters.push(productNameFilterAND);
      debugInfo.push(
        `🔧 Filtro de producto generado (AND): ${JSON.stringify(productNameFilterAND, null, 2)}`
      );
    }

    // Client search filters - ANÁLISIS CRÍTICO AQUÍ
    if (typeof queryObj.clientName === 'string' && queryObj.clientName.trim() !== '') {
      const clientNameWords = queryObj.clientName.trim().split(/\s+/);
      debugInfo.push(`👤 Cliente - Palabras encontradas: ${JSON.stringify(clientNameWords)}`);

      // CAMBIO: Usar AND Logic - Busca nombres que contengan TODAS las palabras
      // Ejemplo: "ruben va" solo encuentra clientes que tengan AMBAS palabras en su nombre
      // "RUBEN JAVIER VARGAS ALVARADO" ✅ (contiene "ruben" Y "va")
      // "RUBEN MARTINEZ" ❌ (contiene "ruben" pero NO "va")
      // "CARLOS VARGAS" ❌ (contiene "va" pero NO "ruben")

      const clientNameFilterAND = {
        AND: clientNameWords.map((word) => ({
          client: { name: { contains: word, mode: 'insensitive' } },
        })),
      };

      searchFilters.push(clientNameFilterAND);
      debugInfo.push(
        `🔧 Filtro de cliente generado (AND): ${JSON.stringify(clientNameFilterAND, null, 2)}`
      );
    }

    if (typeof queryObj.clientRut === 'string' && queryObj.clientRut.trim() !== '') {
      const clientRutWords = queryObj.clientRut.trim().split(/\s+/);
      debugInfo.push(`🆔 RUT - Palabras encontradas: ${JSON.stringify(clientRutWords)}`);

      const clientRutWordFilters = clientRutWords.map((word) => ({
        client: { rut: { contains: word } },
      }));
      const clientRutFilter =
        clientRutWordFilters.length === 1 ? clientRutWordFilters[0] : { OR: clientRutWordFilters };
      searchFilters.push(clientRutFilter);
      debugInfo.push(`🔧 Filtro de RUT generado: ${JSON.stringify(clientRutFilter, null, 2)}`);
    }

    // Construct final filter logic
    let finalSearchFilter: Record<string, unknown> = {};
    console.log('🔎 Filtros de búsqueda generados:', JSON.stringify(searchFilters, null, 2));
    if (searchFilters.length === 1) {
      finalSearchFilter = searchFilters[0] as Record<string, unknown>;
      debugInfo.push(`🎯 Filtro único aplicado: ${JSON.stringify(finalSearchFilter, null, 2)}`);
    } else if (searchFilters.length > 1) {
      // OR entre diferentes tipos de búsqueda (código, producto, cliente, RUT)
      finalSearchFilter = { OR: searchFilters };
      debugInfo.push(`🎯 Múltiples filtros con OR: ${JSON.stringify(finalSearchFilter, null, 2)}`);
    }

    return { whereClause: finalSearchFilter, debugInfo };
  }

  /**
   * Construye filtros adicionales (fechas, estados, etc.)
   */
  private buildOtherFilters(queryObj: Record<string, unknown>): Record<string, unknown> {
    const otherFilters: Record<string, unknown> = {};

    if (typeof queryObj.isFinished === 'boolean') {
      otherFilters.isFinished = queryObj.isFinished;
    }
    if (typeof queryObj.paymentMethod === 'string') {
      otherFilters.paymentMethod = queryObj.paymentMethod;
    }
    if (typeof queryObj.startDate === 'string') {
      otherFilters.createdAt = {
        ...(typeof otherFilters.createdAt === 'object' && otherFilters.createdAt !== null
          ? otherFilters.createdAt
          : {}),
        gte: new Date(queryObj.startDate),
      };
    }
    if (typeof queryObj.endDate === 'string') {
      otherFilters.createdAt = {
        ...(typeof otherFilters.createdAt === 'object' && otherFilters.createdAt !== null
          ? otherFilters.createdAt
          : {}),
        lte: new Date(queryObj.endDate),
      };
    }
    if (typeof queryObj.isPaid === 'boolean') {
      otherFilters.isPaid = queryObj.isPaid;
    }

    return otherFilters;
  }

  public async getAll(query?: unknown): Promise<Rent[]> {
    let whereClause: Prisma.RentWhereInput = {};

    console.log('🔍 getAll - Query recibida:', JSON.stringify(query, null, 2));

    // Handle query filtering - LINQ-like Where clause
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      // Usar la lógica extraída
      const { whereClause: searchWhereClause, debugInfo } = this.buildSearchFilters(queryObj);
      const otherFilters = this.buildOtherFilters(queryObj);

      // Log debug info
      debugInfo.forEach((info) => console.log(info));

      // Combinar filtros de búsqueda y otros filtros
      whereClause = {
        ...otherFilters,
        ...searchWhereClause,
      };
    }

    console.log('🔍 WhereClause final enviado a Prisma:', JSON.stringify(whereClause, null, 2));

    const rents = await this.prisma.rent.findMany({
      where: whereClause,
      include: {
        client: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' }, // Similar to LINQ OrderByDescending
    });

    console.log(`📊 Resultados encontrados: ${rents.length} arriendos`);
    if (rents.length > 0) {
      console.log('📋 Muestra de resultados:');
      rents.slice(0, 3).forEach((rent, index) => {
        console.log(
          `  ${index + 1}. Cliente: "${rent.client.name}" | Producto: "${rent.product.name}"`
        );
      });
    }

    return rents.map(this.mapToRentEntity);
  }

  public async getActiveRents(query?: unknown): Promise<Rent[]> {
    let whereClause: Prisma.RentWhereInput = { isFinished: false };

    console.log('🔍 getActiveRents - Query recibida:', JSON.stringify(query, null, 2));

    // Handle additional query filtering for active rents
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      // Usar la lógica extraída
      const { whereClause: searchWhereClause, debugInfo } = this.buildSearchFilters(queryObj);
      const otherFilters = this.buildOtherFilters(queryObj);

      // Log debug info
      debugInfo.forEach((info) => console.log(info));

      // Combinar filtros de búsqueda y otros filtros, manteniendo isFinished: false
      whereClause = {
        isFinished: false, // Mantener este filtro base
        ...otherFilters,
        ...searchWhereClause,
      };
    }

    console.log('🔍 WhereClause final enviado a Prisma:', JSON.stringify(whereClause, null, 2));

    const rents = await this.prisma.rent.findMany({
      where: whereClause,
      include: {
        client: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Resultados encontrados: ${rents.length} arriendos`);
    if (rents.length > 0) {
      console.log('📋 Muestra de resultados:');
      rents.slice(0, 3).forEach((rent, index) => {
        console.log(
          `  ${index + 1}. Cliente: "${rent.client.name}" | Producto: "${rent.product.name}"`
        );
      });
    }

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

      // Usar la lógica extraída
      const { whereClause: searchWhereClause, debugInfo } = this.buildSearchFilters(queryObj);
      const otherFilters = this.buildOtherFilters(queryObj);

      // Log debug info
      debugInfo.forEach((info) => console.log(info));

      // Combinar filtros de búsqueda y otros filtros, manteniendo isFinished: true
      whereClause = {
        isFinished: true, // Mantener este filtro base
        ...otherFilters,
        ...searchWhereClause,
      };
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
      orderBy: { deliveryDate: 'desc' },
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
  }

  public async create(rent: Rent): Promise<Rent> {
    const createdRent = await this.prisma.rent.create({
      data: {
        quantity: rent.quantity,
        deliveryDate: rent.deliveryDate || '',
        paymentMethod: rent.paymentMethod || '', // Hacer opcional al crear
        warrantyValue: rent.warrantyValue,
        warrantyType: rent.warrantyType || 'Sin garantía',
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
  }

  public async update(id: string, data: Rent): Promise<string | null> {
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
        warrantyType: data.warrantyType || 'Sin garantía',
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
  }

  public async delete(id: string): Promise<{ deletedCount: number }> {
    const rentId = parseInt(id, 10);
    if (isNaN(rentId)) {
      return { deletedCount: 0 };
    }

    await this.prisma.rent.delete({
      where: { id: rentId },
    });

    return { deletedCount: 1 };
  }
  public async finishRent(
    id: string,
    deliveryDate: string,
    totalDays?: number,
    totalPrice?: number,
    observations?: string,
    isPaid?: boolean,
    paymentMethod?: string // Agregar paymentMethod como parámetro
  ): Promise<string | null> {
    try {
      const rentId = parseInt(id, 10);
      if (isNaN(rentId)) {
        return null;
      }

      // Validar que paymentMethod esté presente al finalizar
      if (!paymentMethod || paymentMethod.trim() === '') {
        throw new Error('Payment method is required when finishing a rent');
      }

      const updatedRent = await this.prisma.rent.update({
        where: { id: rentId },
        data: {
          isFinished: true,
          deliveryDate: deliveryDate,
          paymentMethod: paymentMethod, // Actualizar el método de pago al finalizar
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
      paymentMethod: rent.paymentMethod || undefined, // Hacer opcional si está vacío
      warrantyValue: Number(rent.warrantyValue),
      warrantyType: rent.warrantyType || undefined,
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
