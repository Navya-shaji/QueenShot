import { User } from '../entities/User';

/**
 * UserRepository Interface
 * Defines the contracts for all database/persistence operations relating to Users.
 * 
 * Enforces Dependency Inversion Principle (DIP): High-level Use Cases depend on this
 * interface, while concrete adapters (e.g., MongooseUserRepository) implement it.
 */
export interface UserRepository {
  /**
   * Finds a user profile by their unique database ID
   * @param id - User ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user profile by their email address
   * @param email - User email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Persists or updates a user profile domain entity
   * @param user - Domain entity instance
   */
  save(user: User): Promise<User>;
}
