import { AzureFunction, HttpRequest } from '@azure/functions';
import { Context } from 'vm';
import { generateToken } from '../src/shared/jwtHelper';
import { FunctionHandler } from '../src/application/services/Main';
import { UserFactory } from '../src/factories/UserFactory';
import { UserService } from '../src/application/services/UserService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcLogin: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  log.logInfo(`Http function processed request for url "${req.url}"`);

  // Validar que el request tenga body con username y password
  if (!req.body || !req.body.username || !req.body.password) {
    context.res = {
      status: 401,
      body: JSON.stringify({ error: 'Invalid credentials' }),
    };
    return;
  }

  const { username, password } = req.body;
  log.logInfo(`Login attempt for username: ${username}`);

  try {
    const userService: UserService = await UserFactory(log);

    // Buscar usuario por username
    const users = await userService.getAllUsers({ username });
    const user = users.length > 0 ? users[0] : null;

    // Verificar que el usuario existe Y que la contraseña coincida (texto plano)
    if (!user || user.password !== password) {
      log.logWarning(`Login failed for username: ${username}`);
      context.res = {
        status: 401,
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
      return;
    }

    // Generar token solo si usuario y password son correctos
    const token = generateToken({
      id: user.id,
      role: user.role,
      name: user.name,
      username: user.username,
      membershipPaid: user.membershipPaid,
    });

    log.logInfo(`✅ Successful login for user: ${username}`);

    context.res = {
      status: 200,
      body: token,
    };
  } catch (error) {
    log.logError('Login function error:', error);
    context.res = {
      status: 401,
      body: JSON.stringify({ error: 'Invalid credentials' }),
    };
  }
};

export = FunctionHandler(funcLogin, true);
