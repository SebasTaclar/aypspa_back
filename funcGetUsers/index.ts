import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { UserFactory } from '../src/factories/UserFactory';
import { UserService } from '../src/application/services/UserService';
import { FunctionHandler } from '../src/application/services/Main';
import { LogModel } from '../src/domain/entities/LogModel';

const funcGetUsers: AzureFunction = async (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> => {
  log.logInfo(`Http function processed request for url "${req.url}"`);
  const userService: UserService = await UserFactory(log);
  const users = await userService.getAllUsers(req.query);
  context.res = { status: 200, body: JSON.stringify(users) };
};

export = FunctionHandler(funcGetUsers);
