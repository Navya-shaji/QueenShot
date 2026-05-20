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
      const userId = (req.headers['x-user-id'] as string) || ((req as any).user && (req as any).user.id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Missing authenticated User ID header (x-user-id).'
        });
      }

      const defaultData = {
        username: (req.headers['x-user-name'] as string) || undefined,
        email: (req.headers['x-user-email'] as string) || undefined
      };

      const user = await this.getUserProfile.execute(userId, defaultData);

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          stats: {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            gamesLost: user.gamesLost,
            winRatio: user.gamesPlayed > 0 ? parseFloat((user.gamesWon / user.gamesPlayed).toFixed(2)) : 0,
            eloRating: user.eloRating,
            coinsCollected: user.coinsCollected
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error: any) {
      console.error(`Error in UserController.getProfile: ${error.message}`);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req.headers['x-user-id'] as string) || ((req as any).user && (req as any).user.id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Missing authenticated User ID header (x-user-id).'
        });
      }

      const { username, avatarUrl } = req.body;

      const user = await this.updateUserProfile.execute(userId, { username, avatarUrl });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          stats: {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            gamesLost: user.gamesLost,
            winRatio: user.gamesPlayed > 0 ? parseFloat((user.gamesWon / user.gamesPlayed).toFixed(2)) : 0,
            eloRating: user.eloRating,
            coinsCollected: user.coinsCollected
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error: any) {
      console.error(`Error in UserController.updateProfile: ${error.message}`);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}
