import { Request, Response } from 'express';
import { GoogleLoginUseCase } from '../../application/use-cases/GoogleLoginUseCase';
import { UpdateStatsUseCase } from '../../application/use-cases/UpdateStatsUseCase';

export class AuthController {
  constructor(
    private googleLoginUseCase: GoogleLoginUseCase,
    private updateStatsUseCase: UpdateStatsUseCase
  ) {}

  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        res.status(400).json({
          success: false,
          error: 'idToken is required in request body.',
        });
        return;
      }

      const result = await this.googleLoginUseCase.execute({ idToken });
      res.status(200).json({
        success: true,
        message: 'Google login successful.',
        data: result,
      });
    } catch (error: any) {
      console.error('AuthController Error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Authentication failed.',
      });
    }
  }

  async updateStats(req: Request, res: Response): Promise<void> {
    try {
      // The authenticated user session is populated by the auth middleware
      const userId = (req as any).user?.userId;
      const { win } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: Missing user authentication session.',
        });
        return;
      }

      if (win === undefined) {
        res.status(400).json({
          success: false,
          error: 'win (boolean) parameter is required in request body.',
        });
        return;
      }

      const updatedUser = await this.updateStatsUseCase.execute({
        userId,
        win: !!win,
      });

      res.status(200).json({
        success: true,
        message: 'User statistics updated successfully.',
        data: {
          user: updatedUser.toJSON(),
        },
      });
    } catch (error: any) {
      console.error('AuthController.updateStats Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update statistics.',
      });
    }
  }
}
