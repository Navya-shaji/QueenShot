const User = require('../domain/entities/User');

/**
 * GetUserProfile Use Case (Application Logic)
 * Fetches a user's gaming profile from the repository.
 * If the user's profile does not exist yet (first-time login), it automatically bootstraps
 * a new default profile to ensure smooth onboarding.
 */
class GetUserProfile {
  /**
   * Injecting dependencies through constructor (Dependency Inversion Principle)
   * @param {UserRepository} userRepository 
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Executes the use case
   * @param {string} userId - The unique user ID
   * @param {Object} defaultData - Optional fields like email or initial name
   * @returns {Promise<User>}
   */
  async execute(userId, defaultData = {}) {
    if (!userId) {
      throw new Error('Cannot retrieve profile: User ID is required.');
    }

    let user = await this.userRepository.findById(userId);

    // If profile doesn't exist, automatically bootstrap a new one (Onboarding UX)
    if (!user) {
      console.log(`Profile not found for user: ${userId}. Bootstrapping default profile.`);
      
      const uniqueSuffix = userId.length > 4 ? userId.substring(userId.length - 4) : Math.floor(1000 + Math.random() * 9000);
      const defaultUsername = defaultData.username || `Player_${uniqueSuffix}`;
      
      user = new User({
        id: userId,
        username: defaultUsername,
        email: defaultData.email || '',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${defaultUsername}`,
      });

      // Enforce business validation rules
      user.validate();

      // Persist the newly created user in MongoDB
      user = await this.userRepository.save(user);
    }

    return user;
  }
}

module.exports = GetUserProfile;
