import { Rent } from '../entities/Rent';

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
   * Retrieves finished rents
   * @param query - Optional query parameters for filtering
   * @returns Promise containing array of finished rents
   */
  getFinishedRents(query?: unknown): Promise<Rent[]>;

  /**
   * Marks a rent as finished
   * @param id - The unique identifier of the rent to finish
   * @param deliveryDate - The delivery date when the rent was finished
   * @returns Promise containing the updated rent ID or null if not found
   */
  finishRent(id: string, deliveryDate: string): Promise<string | null>;
}
