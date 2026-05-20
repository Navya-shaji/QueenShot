import mongoose, { Schema, Document } from 'mongoose';

export interface UserDatabaseRecord {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  googleId: string;
  xp: number;
  gamesPlayed: number;
  wins: number;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = UserDatabaseRecord & Document;

const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    picture: { type: String },
    role: { type: String, default: 'user' },
    googleId: { type: String, required: true, unique: true, index: true },
    xp: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    id: false,
  }
);

// Fallback to avoid mongoose schema compiling errors during hot reloads
const MongooseUserModel = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

export class UserModel {
  /**
   * Find a single record matching the query from MongoDB.
   */
  static async findOne(query: Partial<UserDatabaseRecord>): Promise<UserDatabaseRecord | null> {
    try {
      const record = await MongooseUserModel.findOne(query).lean();
      return record ? (record as unknown as UserDatabaseRecord) : null;
    } catch (error) {
      console.error('UserModel.findOne Error:', error);
      return null;
    }
  }

  /**
   * Insert a new record into MongoDB.
   */
  static async create(record: UserDatabaseRecord): Promise<UserDatabaseRecord> {
    try {
      const doc = new MongooseUserModel(record);
      await doc.save();
      return doc.toObject() as unknown as UserDatabaseRecord;
    } catch (error) {
      console.error('UserModel.create Error:', error);
      throw error;
    }
  }

  /**
   * Find a record by its custom ID and update it.
   */
  static async findByIdAndUpdate(
    id: string,
    update: Partial<UserDatabaseRecord>
  ): Promise<UserDatabaseRecord | null> {
    try {
      const doc = await MongooseUserModel.findOneAndUpdate(
        { id },
        { $set: update },
        { new: true }
      ).lean();
      return doc ? (doc as unknown as UserDatabaseRecord) : null;
    } catch (error) {
      console.error('UserModel.findByIdAndUpdate Error:', error);
      throw error;
    }
  }
}
