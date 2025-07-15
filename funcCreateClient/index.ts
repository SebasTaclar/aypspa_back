import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { ClientFactory } from '../src/factories/ClientFactory';
import { ClientService } from '../src/application/services/ClientService';
import { FunctionHandler } from '../src/application/services/Main';
import { LogModel } from '../src/domain/entities/LogModel';

const funcCreateClient: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);
  const ClientService: ClientService = await ClientFactory(log);
  const clients = await ClientService.createClient(req.body);
  context.res = { status: 200, body: JSON.stringify(clients) };
};

export = FunctionHandler(funcCreateClient);
