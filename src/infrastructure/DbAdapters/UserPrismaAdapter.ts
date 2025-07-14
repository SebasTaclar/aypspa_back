import { getPrismaClient } from '../../config/PrismaClient';
import { IUserDataSource } from '../../domain/interfaces/IUserDataSource';
import { User } from '../../domain/entities/User';
import { Prisma } from '@prisma/client';

export class UserPrismaAdapter implements IUserDataSource {
  private readonly prisma = getPrismaClient();

  public async getAll(query?: unknown): Promise<User[]> {
    let whereClause: Prisma.UserWhereInput = {};

    // Handle query filtering - similar to LINQ Where clause
    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      // Build dynamic where clause
      whereClause = {
        ...(typeof queryObj.username === 'string' && {
          username: { contains: queryObj.username, mode: 'insensitive' as const },
        }),
        ...(typeof queryObj.name === 'string' && {
          name: { contains: queryObj.name, mode: 'insensitive' as const },
        }),
        ...(typeof queryObj.role === 'string' && { role: queryObj.role }),
        // Add more conditions as needed
      };
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' }, // Similar to LINQ OrderBy
    });

    return users.map((user) => ({
      id: user.id.toString(),
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
    }));
  }

  public async getById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
        role: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id.toString(),
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
    };
  }

  public async create(user: User): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        username: user.username,
        password: user.password,
        name: user.name,
        role: user.role,
      },
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
        role: true,
      },
    });

    return {
      id: createdUser.id.toString(),
      username: createdUser.username,
      password: createdUser.password,
      name: createdUser.name,
      role: createdUser.role,
    };
  }

  public async update(id: string, user: Partial<User>): Promise<User | null> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          ...(user.username && { username: user.username }),
          ...(user.password && { password: user.password }),
          ...(user.name && { name: user.name }),
          ...(user.role && { role: user.role }),
        },
        select: {
          id: true,
          username: true,
          password: true,
          name: true,
          role: true,
        },
      });

      return {
        id: updatedUser.id.toString(),
        username: updatedUser.username,
        password: updatedUser.password,
        name: updatedUser.name,
        role: updatedUser.role,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null; // Record not found
      }
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { id: parseInt(id) },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false; // Record not found
      }
      throw error;
    }
  }

  // Additional LINQ-like methods
  public async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
        role: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id.toString(),
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
    };
  }

  public async findByRole(role: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => ({
      id: user.id.toString(),
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
    }));
  }

  public async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }
}
