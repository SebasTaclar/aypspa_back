export type Product = {
  _id: string | null;
  name: string;
  code: string;
  brand: string;
  priceNet: number;
  priceIva: number;
  priceTotal: number;
  priceWarranty: number;
  rented: boolean;
  createdAt: string;
  updatedAt: string | null;
};
