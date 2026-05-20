import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';
import mongoose from 'mongoose';
import UserModel from '../../infrastructure/database/models/UserModel';

export class MongooseUserRepository implements UserRepository {
  private mockDb: Map<string, User>;

  constructor() {
    this.mockDb = new Map<string, User>();
  }

  private isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  private toDomain(doc: any): User | null {
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

  async findById(id: string): Promise<User | null> {
    if (this.isDbConnected()) {
      try {
        const doc = await UserModel.findById(id);
        return this.toDomain(doc);
      } catch (error: any) {
        console.error(`Error querying user by ID in Mongo: ${error.message}`);
        return null;
      }
    } else {
      return this.mockDb.get(id) || null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.isDbConnected()) {
      try {
        const doc = await UserModel.findOne({ email });
        return this.toDomain(doc);
      } catch (error: any) {
        console.error(`Error querying user by Email in Mongo: ${error.message}`);
        return null;
      }
    } else {
      for (const user of Array.from(this.mockDb.values())) {
        if (user.email === email) return user;
      }
      return null;
    }
  }

  async save(user: User): Promise<User> {
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

        const doc = await UserModel.findByIdAndUpdate(
          user.id,
          { $set: payload },
          { new: true, upsert: true, runValidators: true }
        );

        return this.toDomain(doc)!;
      } catch (error: any) {
        console.error(`Error saving user to MongoDB: ${error.message}`);
        throw error;
      }
    } else {
      user.updatedAt = new Date();
      if (!user.createdAt) user.createdAt = new Date();
      this.mockDb.set(user.id, user);
      return user;
    }
  }
}
