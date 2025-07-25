import {
  IRentDataSource,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/interfaces/IRentDataSource';
import { Rent } from '../../domain/entities/Rent';
import { RentQueryDto } from '../dtos/RentDto';

export class RentService {
  private readonly rentRepository: IRentDataSource;

  constructor(rentRepository: IRentDataSource) {
    if (!rentRepository) {
      throw new Error('A valid IRentDataSource instance is required.');
    }

    this.rentRepository = rentRepository;
  }

  /**
   * Retrieves all rents based on optional query parameters
   * @param query - Optional query parameters for filtering
   * @returns Promise containing array of rents
   */
  public async getAllRents(query?: RentQueryDto): Promise<Rent[]> {
    return this.rentRepository.getAll(query);
  }

  /**
   * Retrieves active rents (not finished)
   * @param query - Optional query parameters for filtering
   * @returns Promise containing array of active rents
   */
  public async getActiveRents(query?: RentQueryDto): Promise<Rent[]> {
    return this.rentRepository.getActiveRents(query);
  }

  /**
   * Retrieves finished rents with pagination
   * @param query - Optional query parameters for filtering
   * @param pagination - Optional pagination parameters
   * @returns Promise containing paginated finished rents
   */
  public async getFinishedRents(
    query?: RentQueryDto,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Rent>> {
    return this.rentRepository.getFinishedRents(query, pagination);
  }

  /**
   * Retrieves a specific rent by its ID
   * @param id - The unique identifier of the rent
   * @returns Promise containing the rent or null if not found
   */
  public async getRentById(id: string): Promise<Rent | null> {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid rent ID is required.');
    }
    return this.rentRepository.getById(id);
  }

  /**
   * Creates a new rent
   * @param rent - The rent data to create
   * @returns Promise containing the created rent
   */
  public async createRent(rent: Rent): Promise<Rent> {
    if (!rent) {
      throw new Error('Valid rent data is required.');
    }

    return this.rentRepository.create(rent);
  }

  /**
   * Updates an existing rent
   * @param id - The unique identifier of the rent to update
   * @param data - The updated rent data
   * @returns Promise containing the updated rent ID or null if not found
   */
  public async updateRent(id: string, data: Rent): Promise<string | null> {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid rent ID is required.');
    }
    if (!data) {
      throw new Error('Valid rent data is required.');
    }
    return this.rentRepository.update(id, data);
  }

  /**
   * Deletes a rent by its ID
   * @param id - The unique identifier of the rent to delete
   * @returns Promise containing the deletion result
   */
  public async deleteRent(id: string): Promise<{ deletedCount: number }> {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid rent ID is required.');
    }
    return this.rentRepository.delete(id);
  }

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
  public async finishRent(
    id: string,
    deliveryDate?: string,
    totalDays?: number,
    totalPrice?: number,
    observations?: string,
    isPaid?: boolean,
    paymentMethod?: string
  ): Promise<string | null> {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid rent ID is required.');
    }

    if (!paymentMethod || paymentMethod.trim() === '') {
      throw new Error('Payment method is required when finishing a rent.');
    }

    const finalDeliveryDate = deliveryDate || new Date().toISOString();
    return this.rentRepository.finishRent(
      id,
      finalDeliveryDate,
      totalDays,
      totalPrice,
      observations,
      isPaid,
      paymentMethod
    );
  }
}
