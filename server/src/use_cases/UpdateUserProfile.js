/**
 * UpdateUserProfile Use Case (Application Logic)
 * Handles modifications to a user's cosmetic profile (like username and avatar url).
 */
class UpdateUserProfile {
  /**
   * Injecting dependencies (Dependency Inversion Principle)
   * @param {UserRepository} userRepository 
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Executes profile modification
   * @param {string} userId 
   * @param {Object} updateData - Elements to update (username, avatarUrl)
   * @returns {Promise<User>}
   */
  async execute(userId, updateData = {}) {
    if (!userId) {
      throw new Error('Cannot update profile: User ID is required.');
    }

    // Retrieve the domain model
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Cannot update profile: User profile does not exist.');
    }

    // Modify the model using entity actions (enforcing domain rules & validations)
    user.updateProfile({
      username: updateData.username,
      avatarUrl: updateData.avatarUrl
    });

    // Save the valid model back to MongoDB
    return await this.userRepository.save(user);
  }
}

module.exports = UpdateUserProfile;
