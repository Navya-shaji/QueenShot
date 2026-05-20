import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export interface UpdateStatsDTO {
  userId: string;
  win: boolean;
}

export class UpdateStatsUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: UpdateStatsDTO): Promise<User> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const updatedUser = User.create({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      googleId: user.googleId,
      createdAt: user.createdAt,
      updatedAt: new Date(),
      gamesPlayed: user.gamesPlayed + 1,
      wins: user.wins + (dto.win ? 1 : 0),
      xp: user.xp + (dto.win ? 50 : 15),
    });

    return await this.userRepository.save(updatedUser);
  }
}
