const UserRepository = require('../../domain/repositories/UserRepository');
const User = require('../../domain/entities/User');
const UserModel = require('../../infrastructure/database/models/UserModel');
const mongoose = require('mongoose');

/**
 * MongooseUserRepository
 * Concrete database adapter implementing the abstract UserRepository domain contract.
 * 
 * Enforces Liskov Substitution Principle (LSP): Dynamically falls back to an
 * in-memory storage context if MongoDB connection is absent, enabling seamless integration
 * tests without modifying any business routing or application logic!
 */
class MongooseUserRepository extends UserRepository {
  constructor() {
    super();
    // Transient in-memory store for mock fallback mode
    this.mockDb = new Map();
  }

  /**
   * Helper check to determine if MongoDB is active
   */
  isDbConnected() {
    return mongoose.connection.readyState === 1; // 1 = Connected status
  }

  /**
   * Helper mapper: Converts database documents to pure Domain Entity instances
   * @param {Object} doc - Mongoose document
   * @returns {User|null}
   */
  toDomain(doc) {
    if (!doc) return null;
    return new User({
      id: doc._id,
      username: doc.username,
      email: doc.email,
      avatarUrl: doc.avatarUrl,
      gamesPlayed: doc.gamesPlayed,
      gamesWon: doc.gamesWon,
      gamesLost: doc.gamesLost,
      eloRating: doc.eloRating,
      coinsCollected: doc.coinsCollected,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  /**
   * Finds user by ID
   */
  async findById(id) {
    if (this.isDbConnected()) {
      try {
        const doc = await UserModel.findById(id);
        return this.toDomain(doc);
      } catch (error) {
        console.error(`Error querying user by ID in Mongo: ${error.message}`);
        return null;
      }
    } else {
      // In-Memory Fallback
      return this.mockDb.get(id) || null;
    }
  }

  /**
   * Finds user by Email
   */
  async findByEmail(email) {
    if (this.isDbConnected()) {
      try {
        const doc = await UserModel.findOne({ email });
        return this.toDomain(doc);
      } catch (error) {
        console.error(`Error querying user by Email in Mongo: ${error.message}`);
        return null;
      }
    } else {
      // In-Memory Fallback
      for (const user of this.mockDb.values()) {
        if (user.email === email) return user;
      }
      return null;
    }
  }

  /**
   * Saves or updates user domain object
   */
  async save(user) {
    if (this.isDbConnected()) {
      try {
        const payload = {
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          gamesLost: user.gamesLost,
          eloRating: user.eloRating,
          coinsCollected: user.coinsCollected
        };

        // Performs a standard Mongoose upsert based on the custom string _id
        const doc = await UserModel.findByIdAndUpdate(
          user.id,
          { $set: payload },
          { new: true, upsert: true, runValidators: true }
        );

        return this.toDomain(doc);
      } catch (error) {
        console.error(`Error saving user to MongoDB: ${error.message}`);
        throw error;
      }
    } else {
      // In-Memory Fallback
      user.updatedAt = new Date();
      if (!user.createdAt) user.createdAt = new Date();
      this.mockDb.set(user.id, user);
      return user;
    }
  }
}

module.exports = MongooseUserRepository;
