export type Rent = {
  id: string;
  // Fields populated from joins (for frontend compatibility)
  code: string; // From product.code
  productName: string; // From product.name
  totalValuePerDay: number; // From product.priceTotal or priceWarranty
  clientRut: string; // From client.rut
  clientName: string; // From client.name
  // Core rent fields
  quantity: number;
  deliveryDate: string;
  paymentMethod: string;
  warrantyValue: number;
  isFinished: boolean;
  isPaid: boolean;
  totalDays?: number;
  totalPrice?: number;
  observations?: string;
  createdAt: string;
  // Internal IDs for database operations
  clientId: number;
  productId: number;
};
