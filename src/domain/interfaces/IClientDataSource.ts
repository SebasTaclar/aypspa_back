import { Client } from '../entities/Client';

export interface IClientDataSource {
  getAll(query?: unknown): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  create(client: Client): Promise<Client>;
  update(id: string, client: Client): Promise<string | null>;
  delete(id: string): Promise<boolean>;
}
