import { IUserDataSource } from '../../domain/interfaces/IUserDataSource';
import { User } from '../../domain/entities/User';

export class UserService {
  private readonly userRepository: IUserDataSource;

  constructor(userRepository: IUserDataSource) {
    if (!userRepository) {
      throw new Error('A valid IUserRepository instance is required.');
    }

    this.userRepository = userRepository;
  }

  public async getAllUsers(query?: unknown): Promise<User[]> {
    return this.userRepository.getAll(query);
  }

  public async getUserById(id: string): Promise<User | null> {
    return this.userRepository.getById(id);
  }

  public async createUser(user: User): Promise<User> {
    return this.userRepository.create(user);
  }

  public async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this.userRepository.update(id, data);
  }

  public async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
