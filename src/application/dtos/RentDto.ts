export type RentDto = {
  id?: string;
  code?: string;
  productName?: string;
  quantity?: number;
  totalValuePerDay?: number;
  clientRut?: string;
  deliveryDate?: string;
  paymentMethod?: string;
  clientName?: string;
  warrantyValue?: number;
  warrantyType?: string;
  creationDate?: string;
  isFinished?: boolean;
};

export type RentRequestDto = {
  code: string;
  productName: string;
  quantity: number;
  totalValuePerDay: number;
  clientRut: string;
  paymentMethod: string;
  clientName: string;
  warrantyValue: number;
  warrantyType?: string;
};

export type RentResponseDto = {
  id: string;
  code: string;
  productName: string;
  quantity: number;
  totalValuePerDay: number;
  clientRut: string;
  deliveryDate: string;
  paymentMethod: string;
  clientName: string;
  warrantyValue: number;
  warrantyType?: string;
  creationDate: string;
  isFinished: boolean;
};

export type RentQueryDto = {
  isFinished?: boolean;
  clientRut?: string;
  code?: string;
  startDate?: string;
  endDate?: string;
};
