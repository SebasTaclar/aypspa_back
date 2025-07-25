export type Rent = {
  id: string; // Required like other entities, but handled specially during creation
  // Fields populated from joins (for frontend compatibility)
  code: string; // From product.code
  productName: string; // From product.name
  totalValuePerDay: number; // From product.priceTotal or priceWarranty
  clientRut: string; // From client.rut
  clientName: string; // From client.name
  // Core rent fields
  quantity: number;
  deliveryDate: string;
  paymentMethod?: string; // Opcional al crear, requerido al finalizar
  warrantyValue: number;
  warrantyType?: string; // Nuevo campo para tipo de garantía
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
