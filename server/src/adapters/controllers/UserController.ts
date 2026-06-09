import { Request, Response } from 'express';
import { GetUserProfile } from '../../use_cases/GetUserProfile';
import { UpdateUserProfile } from '../../use_cases/UpdateUserProfile';

export class UserController {
  private getUserProfile: GetUserProfile;
  private updateUserProfile: UpdateUserProfile;

  constructor(getUserProfileUsecase: GetUserProfile, updateUserProfileUsecase: UpdateUserProfile) {
    this.getUserProfile = getUserProfileUsecase;
    this.updateUserProfile = updateUserProfileUsecase;
  }

  async getProfile(req: Request, res: Response) {
    try {
      // JWT middleware attaches decoded payload as req.user
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Missing user session.'
        });
      }

      const defaultData = {
        username: (req as any).user?.name,
        email: (req as any).user?.email,
      };

      const user = await this.getUserProfile.execute(userId, defaultData);

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          gamesLost: user.gamesLost,
          eloRating: user.eloRating,
          coinsCollected: user.coinsCollected,
          winRatio: user.gamesPlayed > 0
            ? parseFloat((user.gamesWon / user.gamesPlayed).toFixed(2))
            : 0,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    } catch (error: any) {
      console.error(`UserController.getProfile error: ${error.message}`);
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Missing user session.'
        });
      }

      const { username, avatarUrl } = req.body;

      if (!username && !avatarUrl) {
        return res.status(400).json({
          success: false,
          error: 'At least one field (username or avatarUrl) is required.'
        });
      }

      const user = await this.updateUserProfile.execute(userId, { username, avatarUrl });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          gamesLost: user.gamesLost,
          eloRating: user.eloRating,
          coinsCollected: user.coinsCollected,
          winRatio: user.gamesPlayed > 0
            ? parseFloat((user.gamesWon / user.gamesPlayed).toFixed(2))
            : 0,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    } catch (error: any) {
      console.error(`UserController.updateProfile error: ${error.message}`);
      return res.status(400).json({ success: false, error: error.message });
    }
  }
}
