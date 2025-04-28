import { Client } from '../../domain/entities/Client';

export class ClientDto {
  id: string;
  name: string;
  companyName: string;
  companyDocument: string;
  rut: string;
  phoneNumber: string;
  address: string;
  creationDate: string;
  frequentClient: string;
  created: string;

  public static toEntity(clientDto: ClientDto): Client {
    return {
      id: clientDto.id,
      name: clientDto.name,
      companyName: clientDto.companyName,
      companyDocument: clientDto.companyDocument,
      rut: clientDto.rut,
      phoneNumber: clientDto.phoneNumber,
      address: clientDto.address,
      creationDate: clientDto.creationDate,
      frequentClient: clientDto.frequentClient,
      created: clientDto.created,
    };
  }
}
