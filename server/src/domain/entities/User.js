/**
 * User Domain Entity
 * Pure business entity. Independent of MongoDB/Mongoose or Express frameworks.
 * Encapsulates profile data, constraints validation, and gameplay scoring logic.
 */
class User {
  constructor({
    id,
    username,
    email,
    avatarUrl,
    gamesPlayed = 0,
    gamesWon = 0,
    gamesLost = 0,
    eloRating = 1200,
    coinsCollected = 0,
    createdAt,
    updatedAt
  } = {}) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.avatarUrl = avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=DefaultStriker';
    this.gamesPlayed = gamesPlayed;
    this.gamesWon = gamesWon;
    this.gamesLost = gamesLost;
    this.eloRating = eloRating;
    this.coinsCollected = coinsCollected;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Domain Validation Rule (Single Responsibility Principle)
   */
  validate() {
    if (!this.username || this.username.trim() === '') {
      throw new Error('Username is required and cannot be empty.');
    }
    if (this.username.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (this.username.length > 25) {
      throw new Error('Username cannot exceed 25 characters.');
    }
    if (this.email && !this.email.includes('@')) {
      throw new Error('Invalid email address format.');
    }
  }

  /**
   * Modifies User Profile parameters safely (Open-Closed Principle)
   */
  updateProfile({ username, avatarUrl }) {
    if (username !== undefined) this.username = username;
    if (avatarUrl !== undefined) this.avatarUrl = avatarUrl;
    
    // Always enforce constraints after updating
    this.validate();
  }

  /**
   * Applies Elo Rating System physics and stats update after a Carrom match
   * @param {boolean} isWin - Did the player win the match
   * @param {number} pucksPocketed - Number of pucks pocketed in this game
   * @param {number} opponentElo - Elo rating of the opponent
   */
  recordMatchResult(isWin, pucksPocketed, opponentElo) {
    this.gamesPlayed += 1;
    if (isWin) {
      this.gamesWon += 1;
    } else {
      this.gamesLost += 1;
    }
    this.coinsCollected += (pucksPocketed || 0);

    // Standard Elo Rating formula (K-factor = 32)
    const K = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - this.eloRating) / 400));
    const actualScore = isWin ? 1 : 0;
    
    // Adjust Elo
    const eloChange = Math.round(K * (actualScore - expectedScore));
    this.eloRating += eloChange;
    
    // Floor Elo at 100 to prevent drop below minimum rating
    if (this.eloRating < 100) this.eloRating = 100;
  }
}

module.exports = User;
