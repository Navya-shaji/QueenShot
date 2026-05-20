import { User } from '../domain/entities/User';
import { UserRepository } from '../domain/repositories/UserRepository';

export class UpdateUserStats {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string, gameResult: { isWin: boolean; pucksPocketed: number; opponentElo: number }): Promise<User> {
    if (!userId) {
      throw new Error('Cannot update stats: User ID is required.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Cannot update stats: User profile does not exist.');
    }

    user.recordMatchResult(gameResult.isWin, gameResult.pucksPocketed, gameResult.opponentElo);

    return await this.userRepository.save(user);
  }
}
