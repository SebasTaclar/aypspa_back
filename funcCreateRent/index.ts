import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FunctionHandler } from '../src/application/services/Main';
import { RentFactory } from '../src/factories/RentFactory';
import { ClientFactory } from '../src/factories/ClientFactory';
import { ProductFactory } from '../src/factories/ProductFactory';
import { RentService } from '../src/application/services/RentService';
import { ClientService } from '../src/application/services/ClientService';
import { ProductService } from '../src/application/services/ProductService';
import { Rent } from '../src/domain/entities/Rent';
import { LogModel } from '../src/domain/entities/LogModel';

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

    // Initialize services
    const rentService: RentService = await RentFactory(log);
    const clientService: ClientService = await ClientFactory(log);
    const productService: ProductService = await ProductFactory(log);

    // Validate required fields
    const requiredFields = [
      'code',
      'productName',
      'quantity',
      'totalValuePerDay',
      'clientRut',
      'clientName',
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    // Special validation for warrantyValue - allow 0 but not undefined/null/empty
    if (
      req.body.warrantyValue === undefined ||
      req.body.warrantyValue === null ||
      req.body.warrantyValue === ''
    ) {
      missingFields.push('warrantyValue');
    }

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

    // Find or create client by RUT
    const clients = await clientService.getAllClients({ rut: req.body.clientRut });
    let client;

    if (clients.length === 0) {
      // Client doesn't exist, create it
      log.logInfo(`Client with RUT ${req.body.clientRut} not found, creating new client`);

      const newClientData = {
        id: '', // Will be auto-generated
        name: req.body.clientName,
        companyName: '', // Default empty
        companyDocument: '',
        rut: req.body.clientRut,
        phoneNumber: '',
        address: '',
        creationDate: new Date().toISOString().split('T')[0], // Today's date
        frequentClient: 'No', // Default value
        created: new Date().toISOString(),
      };

      client = await clientService.createClient(newClientData);
      log.logInfo(`Successfully created new client with ID: ${client.id}`);
    } else {
      client = clients[0];
      log.logInfo(`Found existing client with ID: ${client.id}`);
    }

    // Find or create product by code first, then by name as fallback
    let products: any[] = [];
    let product;

    // First, try to find by code if provided
    if (req.body.code) {
      products = await productService.getAllProducts({ code: req.body.code });
      if (products.length > 0) {
        product = products[0];
        log.logInfo(`Found existing product by code "${req.body.code}" with ID: ${product._id}`);
      }
    }

    // If not found by code, try to find by name
    if (!product && req.body.productName) {
      products = await productService.getAllProducts({ name: req.body.productName });
      if (products.length > 0) {
        product = products[0];
        log.logInfo(
          `Found existing product by name "${req.body.productName}" with ID: ${product._id}`
        );
      }
    }

    // If still not found, create new product
    if (!product) {
      log.logInfo(
        `Product not found by code "${req.body.code}" or name "${req.body.productName}", creating new product`
      );

      // Generate a unique code - use provided code or generate from name
      let productCode = req.body.code;
      if (!productCode && req.body.productName) {
        productCode = req.body.productName.replace(/\s+/g, '').substring(0, 10).toUpperCase();
      }

      // Check if the code already exists to avoid duplicates
      if (productCode) {
        const existingByCode = await productService.getAllProducts({ code: productCode });
        if (existingByCode.length > 0) {
          // If code exists, append timestamp to make it unique
          productCode = `${productCode}_${Date.now().toString().slice(-4)}`;
          log.logInfo(`Code already exists, using unique code: ${productCode}`);
        }
      }

      const newProductData = {
        _id: null, // Will be auto-generated
        name: req.body.productName || productCode || 'Producto sin nombre',
        code: productCode || `PROD_${Date.now()}`,
        brand: 'Sin marca', // Default brand
        priceNet: req.body.totalValuePerDay * 0.81, // Approximate net price (without IVA)
        priceIva: req.body.totalValuePerDay * 0.19, // 19% IVA
        priceTotal: req.body.totalValuePerDay, // Total price from request
        priceWarranty: req.body.warrantyValue || 0,
        rented: true, // Mark as rented since we're creating a rent
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };

      product = await productService.createProduct(newProductData);
      log.logInfo(
        `Successfully created new product with ID: ${product._id} and code: ${product.code}`
      );
    }

    // Create rent data without ID (let database auto-generate it)
    const rentData: Omit<Rent, 'id'> = {
      code: req.body.code,
      // Data from frontend (for compatibility)
      productName: req.body.productName,
      clientRut: req.body.clientRut,
      clientName: req.body.clientName,
      // Core rent data
      quantity: parseInt(req.body.quantity),
      totalValuePerDay: parseFloat(req.body.totalValuePerDay),
      deliveryDate: req.body.deliveryDate || '',
      paymentMethod: req.body.paymentMethod || undefined, // Opcional al crear
      warrantyValue: parseFloat(req.body.warrantyValue),
      warrantyType: req.body.warrantyType || undefined, // Tipo de garantía (cheque, efectivo, etc.)
      isFinished: req.body.isFinished || false,
      isPaid: req.body.isPaid || false,
      totalDays:
        req.body.totalDays !== undefined && req.body.totalDays !== null
          ? parseFloat(req.body.totalDays)
          : undefined,
      totalPrice: req.body.totalPrice ? parseFloat(req.body.totalPrice) : undefined,
      observations: req.body.observations || undefined,
      createdAt: new Date().toISOString(),
      // IDs from database lookups
      clientId: parseInt(client.id),
      productId: parseInt(product._id || '0'),
    };

    // Cast to Rent type (ID will be generated by database)
    const rentToCreate = { id: '', ...rentData } as Rent;

    log.logInfo(
      `Creating rent with code: ${rentData.code} for client: ${client.name} (ID: ${client.id}) and product: ${product.name} (ID: ${product._id})`
    );
    const createdRent = await rentService.createRent(rentToCreate);

    // Mark product as rented after successful rent creation
    if (product._id) {
      const updatedProductData = {
        ...product,
        rented: true,
        updatedAt: new Date().toISOString(),
      };

      await productService.updateProduct(product._id, updatedProductData);
      log.logInfo(`Successfully marked product ${product.code} (ID: ${product._id}) as rented`);
    }

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
