/**
 * UpdateUserStats Use Case (Application Logic)
 * Updates a player's ELO and match statistics (wins, losses, pocketed coins) 
 * after a completed Carrom Board match.
 */
class UpdateUserStats {
  /**
   * Injecting dependencies (Dependency Inversion Principle)
   * @param {UserRepository} userRepository 
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Updates player's stats after a game completes
   * @param {string} userId - Player ID
   * @param {Object} gameResult
   * @param {boolean} gameResult.isWin - If the player won the game
   * @param {number} gameResult.pucksPocketed - Pucks pocketed by the player
   * @param {number} gameResult.opponentElo - Opponent's Elo rating before the game
   * @returns {Promise<User>}
   */
  async execute(userId, { isWin, pucksPocketed, opponentElo }) {
    if (!userId) {
      throw new Error('Cannot update stats: User ID is required.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Cannot update stats: User profile does not exist.');
    }

    // Delegate ELO adjustments and statistics records to the domain model
    user.recordMatchResult(isWin, pucksPocketed, opponentElo);

    // Persist changes in MongoDB
    return await this.userRepository.save(user);
  }
}

module.exports = UpdateUserStats;
