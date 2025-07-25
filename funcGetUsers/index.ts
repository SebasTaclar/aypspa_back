import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { UserFactory } from '../src/factories/UserFactory';
import { UserService } from '../src/application/services/UserService';
import { FunctionHandler } from '../src/application/services/Main';
import { verifyToken } from '../src/shared/jwtHelper';
import { LogModel } from '../src/domain/entities/LogModel';

const funcGetUsers: AzureFunction = async (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> => {
  try {
    log.logInfo(`Http function processed request for url "${req.url}"`);
    const userService: UserService = await UserFactory(log);

    // Check if requesting current user
    if (req.query.current === 'true') {
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        context.res = {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'No authorization token provided',
          }),
        };
        return;
      }

      // Extract and verify token
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      let tokenPayload;

      try {
        tokenPayload = verifyToken(token);
      } catch {
        context.res = {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid token',
          }),
        };
        return;
      }

      // Get FRESH user data from database
      const currentUser = await userService.getUserById(tokenPayload.id);

      if (!currentUser) {
        context.res = {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: false,
            error: 'Not Found',
            message: 'User not found',
          }),
        };
        return;
      }

      // Return fresh user data without password
      const userResponse = {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        role: currentUser.role,
        membershipPaid: currentUser.membershipPaid,
      };

      log.logInfo(
        `Successfully retrieved current user: ${currentUser.username}, membershipPaid: ${currentUser.membershipPaid}`
      );

      context.res = {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify({
          success: true,
          data: userResponse,
          message: 'Current user retrieved successfully',
        }),
      };
      return;
    }

    // Default behavior: get all users with optional filtering
    const users = await userService.getAllUsers(req.query);

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        success: true,
        data: users,
        message: 'Users retrieved successfully',
      }),
    };
  } catch (error: unknown) {
    log.logError(
      `Error in funcGetUsers: ${error instanceof Error ? error.message : String(error)}`
    );

    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve users',
      }),
    };
  }
};

export = FunctionHandler(funcGetUsers);
