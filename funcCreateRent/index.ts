import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { RentFactory } from '../src/factories/RentFactory';
import { RentService } from '../src/application/services/RentService';
import { LogModel } from '../src/domain/entities/LogModel';
import { Rent } from '../src/domain/entities/Rent';

const funcCreateRent: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  try {
    log.logInfo(`Http function processed request for url "${req.url}"`);

    if (!req.body) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'Request body is required',
        }),
      };
      return;
    }

    const rentService: RentService = await RentFactory(log);

    // Validate required fields
    const requiredFields = [
      'code',
      'productName',
      'quantity',
      'totalValuePerDay',
      'clientRut',
      'paymentMethod',
      'clientName',
      'warrantyValue',
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        }),
      };
      return;
    }

    const rentData: Rent = {
      id: req.body.id || Math.floor(Math.random() * 10000).toString(),
      code: req.body.code,
      productName: req.body.productName,
      quantity: parseInt(req.body.quantity),
      totalValuePerDay: parseFloat(req.body.totalValuePerDay),
      clientRut: req.body.clientRut,
      deliveryDate: req.body.deliveryDate || '',
      paymentMethod: req.body.paymentMethod,
      clientName: req.body.clientName,
      warrantyValue: parseFloat(req.body.warrantyValue),
      creationDate: req.body.creationDate || new Date().toISOString(),
      isFinished: req.body.isFinished || false,
    };

    log.logInfo(`Creating rent with code: ${rentData.code}`);
    const createdRent = await rentService.createRent(rentData);

    log.logInfo(`Successfully created rent with ID: ${createdRent.id}`);

    context.res = {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        success: true,
        data: createdRent,
        message: 'Rent created successfully',
      }),
    };
  } catch (error) {
    log.logError(`Error in funcCreateRent: ${error.message}`);
    log.logError(`Stack trace: ${error.stack}`);

    // Handle specific error cases
    let statusCode = 500;
    let errorMessage = 'Failed to create rent';

    if (error.message.includes('already exists')) {
      statusCode = 409; // Conflict
      errorMessage = error.message;
    }

    context.res = {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: statusCode === 409 ? 'Conflict' : 'Internal server error',
        message: errorMessage,
      }),
    };
  }
};

export = FunctionHandler(funcCreateRent);
