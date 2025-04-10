import { IClientDataSource } from '../../domain/interfaces/IClientDataSource';
import { Client } from '../../domain/entities/Client';
import { ClientDto } from '../dtos/ClientDto';

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
    return this.clientRepository.create(ClientDto.toEntity(client));
  }

  public async updateClient(id: string, data: Partial<Client>): Promise<Client | null> {
    return this.clientRepository.update(id, data);
  }

  public async deleteClient(id: string): Promise<boolean> {
    return this.clientRepository.delete(id);
  }
}
