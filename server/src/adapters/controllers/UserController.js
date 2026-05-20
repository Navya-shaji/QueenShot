/**
 * UserController (Interface Adapter)
 * Converts HTTP request details into parameters for our Use Cases,
 * executes them, and formats the returning domain entities as JSON API responses.
 * 
 * Enforces Single Responsibility Principle (SRP): Only maps HTTP inputs/outputs.
 */
class UserController {
  /**
   * Injecting dependencies (Dependency Inversion Principle)
   * @param {GetUserProfile} getUserProfileUsecase 
   * @param {UpdateUserProfile} updateUserProfileUsecase 
   */
  constructor(getUserProfileUsecase, updateUserProfileUsecase) {
    this.getUserProfile = getUserProfileUsecase;
    this.updateUserProfile = updateUserProfileUsecase;
  }

  /**
   * GET /api/users/profile
   * Handles user profile retrieval
   */
  async getProfile(req, res) {
    try {
      // Authentication integration: extract user identity from headers (for easy testing / dev matching)
      // or from req.user (where other developers' passport/JWT middleware will set it)
      const userId = req.headers['x-user-id'] || (req.user && req.user.id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Missing authenticated User ID header (x-user-id).'
        });
      }

      // Metadata fallback for onboarding bootstrapping
      const defaultData = {
        username: req.headers['x-user-name'] || null,
        email: req.headers['x-user-email'] || null
      };

      // Execute the decoupled use case
      const user = await this.getUserProfile.execute(userId, defaultData);

      // Return a clean, premium JSON response
      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          stats: {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            gamesLost: user.gamesLost,
            winRatio: user.gamesPlayed > 0 ? parseFloat((user.gamesWon / user.gamesPlayed).toFixed(2)) : 0,
            eloRating: user.eloRating,
            coinsCollected: user.coinsCollected
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error(`Error in UserController.getProfile: ${error.message}`);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/users/profile
   * Handles profile details updates
   */
  async updateProfile(req, res) {
    try {
      const userId = req.headers['x-user-id'] || (req.user && req.user.id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Missing authenticated User ID header (x-user-id).'
        });
      }

      const { username, avatarUrl } = req.body;

      // Execute decoupled update profile use case
      const user = await this.updateUserProfile.execute(userId, { username, avatarUrl });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          stats: {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            gamesLost: user.gamesLost,
            winRatio: user.gamesPlayed > 0 ? parseFloat((user.gamesWon / user.gamesPlayed).toFixed(2)) : 0,
            eloRating: user.eloRating,
            coinsCollected: user.coinsCollected
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error(`Error in UserController.updateProfile: ${error.message}`);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = UserController;
