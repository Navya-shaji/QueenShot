import { User } from '../domain/entities/User';
import { UserRepository } from '../domain/repositories/UserRepository';

export class UpdateUserProfile {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string, updateData: { username?: string; avatarUrl?: string } = {}): Promise<User> {
    if (!userId) {
      throw new Error('Cannot update profile: User ID is required.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Cannot update profile: User profile does not exist.');
    }

    user.updateProfile({
      username: updateData.username,
      avatarUrl: updateData.avatarUrl
    });

    return await this.userRepository.save(user);
  }
}
