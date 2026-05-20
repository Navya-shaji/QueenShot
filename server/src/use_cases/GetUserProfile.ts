import { User } from '../domain/entities/User';
import { UserRepository } from '../domain/repositories/UserRepository';

export class GetUserProfile {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string, defaultData: { username?: string; email?: string } = {}): Promise<User> {
    if (!userId) {
      throw new Error('Cannot retrieve profile: User ID is required.');
    }

    let user = await this.userRepository.findById(userId);

    // If profile doesn't exist, automatically bootstrap a new one (Onboarding UX)
    if (!user) {
      console.log(`Profile not found for user: ${userId}. Bootstrapping default profile.`);
      
      const uniqueSuffix = userId.length > 4 ? userId.substring(userId.length - 4) : Math.floor(1000 + Math.random() * 9000).toString();
      const defaultUsername = defaultData.username || `Player_${uniqueSuffix}`;
      
      user = new User({
        id: userId,
        username: defaultUsername,
        email: defaultData.email || '',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${defaultUsername}`,
      });

      // Enforce business validation rules
      user = await this.userRepository.save(user);
    }

    return user;
  }
}
