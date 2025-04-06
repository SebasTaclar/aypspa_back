import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { MongoDbAdapter } from '../src/adapters/MongoDbAdapter';
import { UserService } from '../src/services/UserService';
import * as dotenv from 'dotenv';
import { FunctionHandler } from '../src/services/Main';
dotenv.config();

const funcGetUsers: AzureFunction = async (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> => {
  log.logInfo(`Http function processed request for url "${req.url}"`);

  const dbAdapter = MongoDbAdapter.fromEnvironment();
  const userService = new UserService(dbAdapter);

  const users = await userService.getAllUsers(req.query);
  context.res = { status: 200, body: JSON.stringify(users) };

  if (dbAdapter.dispose) {
    await dbAdapter.dispose();
  }
};

export = FunctionHandler(funcGetUsers);
