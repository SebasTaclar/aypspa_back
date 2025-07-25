import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { RentFactory } from '../src/factories/RentFactory';
import { RentService } from '../src/application/services/RentService';
import { LogModel } from '../src/domain/entities/LogModel';

const funcFinishRent: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
  log: LogModel
): Promise<void> {
  try {
    log.logInfo(`Http function processed request for url "${req.url}"`);

    const rentId = req.query.id || (req.params && req.params.id);

    if (!rentId) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'Rent ID is required',
        }),
      };
      return;
    }

    const rentService: RentService = await RentFactory(log);

    // Check if rent exists and is not already finished
    const existingRent = await rentService.getRentById(rentId);
    if (!existingRent) {
      context.res = {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Not Found',
          message: 'Rent not found',
        }),
      };
      return;
    }

    if (existingRent.isFinished) {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'Rent is already finished',
        }),
      };
      return;
    }

    // Get data from request body
    const deliveryDate = (req.body && req.body.deliveryDate) || new Date().toISOString();
    const totalDays = req.body && req.body.totalDays ? parseInt(req.body.totalDays) : undefined;
    const totalPrice =
      req.body && req.body.totalPrice ? parseFloat(req.body.totalPrice) : undefined;
    const observations = req.body && req.body.observations ? req.body.observations : undefined;
    const isPaid = req.body && req.body.isPaid !== undefined ? req.body.isPaid : undefined;
    const paymentMethod = req.body && req.body.paymentMethod ? req.body.paymentMethod : undefined;

    // Validate that paymentMethod is provided
    if (!paymentMethod || paymentMethod.trim() === '') {
      context.res = {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'Payment method is required when finishing a rent',
        }),
      };
      return;
    }

    log.logInfo(`Finishing rent with ID: ${rentId}`);
    const finishedRentId = await rentService.finishRent(
      rentId,
      deliveryDate,
      totalDays,
      totalPrice,
      observations,
      isPaid,
      paymentMethod
    );

    if (!finishedRentId) {
      context.res = {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to finish rent',
        }),
      };
      return;
    }

    log.logInfo(`Successfully finished rent with ID: ${finishedRentId}`);

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        success: true,
        data: {
          id: finishedRentId,
          deliveryDate: deliveryDate,
        },
        message: 'Rent finished successfully',
      }),
    };
  } catch (error) {
    log.logError(`Error in funcFinishRent: ${error.message}`);
    log.logError(`Stack trace: ${error.stack}`);

    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Failed to finish rent',
      }),
    };
  }
};

export = FunctionHandler(funcFinishRent);
