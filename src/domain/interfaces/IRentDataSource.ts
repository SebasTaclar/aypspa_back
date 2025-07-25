import { Rent } from '../entities/Rent';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface IRentDataSource {
  /**
   * Retrieves all rents based on optional query parameters
   * @param query - Optional query parameters for filtering
   * @returns Promise containing array of rents
   */
  getAll(query?: unknown): Promise<Rent[]>;

  /**
   * Retrieves a specific rent by its ID
   * @param id - The unique identifier of the rent
   * @returns Promise containing the rent or null if not found
   */
  getById(id: string): Promise<Rent | null>;

  /**
   * Creates a new rent
   * @param rent - The rent data to create
   * @returns Promise containing the created rent
   */
  create(rent: Rent): Promise<Rent>;

  /**
   * Updates an existing rent
   * @param id - The unique identifier of the rent to update
   * @param data - The updated rent data
   * @returns Promise containing the updated rent ID or null if not found
   */
  update(id: string, data: Rent): Promise<string | null>;

  /**
   * Deletes a rent by its ID
   * @param id - The unique identifier of the rent to delete
   * @returns Promise containing the deletion result
   */
  delete(id: string): Promise<{ deletedCount: number }>;

  /**
   * Retrieves active rents (not finished)
   * @param query - Optional query parameters for filtering
   * @returns Promise containing array of active rents
   */
  getActiveRents(query?: unknown): Promise<Rent[]>;

  /**
   * Retrieves finished rents with pagination
   * @param query - Optional query parameters for filtering
   * @param pagination - Optional pagination parameters
   * @returns Promise containing paginated finished rents
   */
  getFinishedRents(query?: unknown, pagination?: PaginationOptions): Promise<PaginatedResult<Rent>>;

  /**
   * Marks a rent as finished
   * @param id - The unique identifier of the rent to finish
   * @param deliveryDate - The delivery date when the rent was finished
   * @param totalDays - Total days of the rental period
   * @param totalPrice - Total price calculated for the rental
   * @param observations - Additional observations about the rental completion
   * @param isPaid - Whether the rent was paid
   * @param paymentMethod - Payment method used (required when finishing)
   * @returns Promise containing the updated rent ID or null if not found
   */
  finishRent(
    id: string,
    deliveryDate: string,
    totalDays?: number,
    totalPrice?: number,
    observations?: string,
    isPaid?: boolean,
    paymentMethod?: string
  ): Promise<string | null>;
}
