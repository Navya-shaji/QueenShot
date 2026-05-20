import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserRole } from '../../domain/enums/UserRole';
import { UserModel, UserDatabaseRecord } from '../database/UserModel';

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const record = await UserModel.findOne({ email });
    return record ? this.mapToDomain(record) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const record = await UserModel.findOne({ googleId });
    return record ? this.mapToDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await UserModel.findOne({ id });
    return record ? this.mapToDomain(record) : null;
  }

  async save(user: User): Promise<User> {
    const record = await UserModel.findOne({ id: user.id });
    const userDbRecord: UserDatabaseRecord = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      googleId: user.googleId,
      xp: user.xp,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    if (record) {
      await UserModel.findByIdAndUpdate(user.id, userDbRecord);
    } else {
      await UserModel.create(userDbRecord);
    }
    return user;
  }

  private mapToDomain(record: UserDatabaseRecord): User {
    return new User({
      id: record.id,
      email: record.email,
      name: record.name,
      picture: record.picture,
      role: record.role as UserRole,
      googleId: record.googleId,
      xp: record.xp ?? 0,
      gamesPlayed: record.gamesPlayed ?? 0,
      wins: record.wins ?? 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
