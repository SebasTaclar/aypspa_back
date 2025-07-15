import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { ClientService } from '../src/application/services/ClientService';
import { ClientFactory } from '../src/factories/ClientFactory';
import { LogModel } from '../src/domain/entities/LogModel';

const funcDeleteClient: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);
  const ClientService: ClientService = await ClientFactory(log);
  const clients = await ClientService.deleteClient(req.query.id);
  context.res = { status: 200, body: JSON.stringify(clients) };
};

export default FunctionHandler(funcDeleteClient);
