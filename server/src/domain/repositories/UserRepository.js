/**
 * UserRepository Interface (Abstract Class)
 * Defines the contracts for all database/persistence operations relating to Users.
 * 
 * Enforces Dependency Inversion Principle (DIP): High-level Use Cases depend on this
 * interface, while concrete adapters (e.g., MongooseUserRepository) implement it.
 */
class UserRepository {
  /**
   * Finds a user profile by their unique database ID
   * @param {string} id 
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    throw new Error('UserRepository.findById() is not implemented.');
  }

  /**
   * Finds a user profile by their email address
   * @param {string} email 
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    throw new Error('UserRepository.findByEmail() is not implemented.');
  }

  /**
   * Persists or updates a user profile domain entity
   * @param {User} user - Domain entity instance
   * @returns {Promise<User>}
   */
  async save(user) {
    throw new Error('UserRepository.save() is not implemented.');
  }
}

module.exports = UserRepository;
