import { IClientDataSource } from '../../domain/interfaces/IClientDataSource';
import { Client } from '../../domain/entities/Client';

export class ClientService {
  private readonly clientRepository: IClientDataSource;

  constructor(clientRepository: IClientDataSource) {
    if (!clientRepository) {
      throw new Error('A valid IClientDataSource instance is required.');
    }

    this.clientRepository = clientRepository;
  }

  public async getAllClients(query?: unknown): Promise<Client[]> {
    return this.clientRepository.getAll(query);
  }

  public async getClientById(id: string): Promise<Client | null> {
    return this.clientRepository.getById(id);
  }

  public async createClient(client: Client): Promise<Client> {
    return this.clientRepository.create(client);
  }

  public async updateClient(id: string, data: Client): Promise<string | null> {
    return this.clientRepository.update(id, data);
  }

  public async deleteClient(id: string): Promise<boolean> {
    return this.clientRepository.delete(id);
  }
}
