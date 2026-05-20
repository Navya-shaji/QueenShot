import { GoogleLoginDTO } from '../dto/GoogleLoginDTO';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { GoogleTokenVerifier } from '../../infrastructure/services/GoogleTokenVerifier';
import { JwtService } from '../../infrastructure/services/JwtService';
import { User } from '../../domain/entities/User';

export class GoogleLoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private googleTokenVerifier: GoogleTokenVerifier,
    private jwtService: JwtService
  ) {}

  async execute(dto: GoogleLoginDTO): Promise<{ user: any; token: string }> {
    if (!dto.idToken) {
      throw new Error('Google ID token is required.');
    }

    // 1. Verify Google token
    const payload = await this.googleTokenVerifier.verify(dto.idToken);
    if (!payload || !payload.email || !payload.sub) {
      throw new Error('Invalid Google token.');
    }

    const { email, name, picture, sub: googleId } = payload;

    // 2. Check if user already exists by Google ID
    let user = await this.userRepository.findByGoogleId(googleId);

    if (!user) {
      // Fallback: check by email to link accounts if necessary
      user = await this.userRepository.findByEmail(email);

      if (user) {
        // Link Google ID if email matches but Google ID wasn't set
        const updatedUser = User.create({
          id: user.id,
          email: user.email,
          name: name || user.name,
          picture: picture || user.picture,
          googleId: googleId,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: new Date(),
        });
        user = await this.userRepository.save(updatedUser);
      } else {
        // Create new user
        const newUser = User.create({
          email,
          name: name || 'Google User',
          picture,
          googleId,
        });
        user = await this.userRepository.save(newUser);
      }
    } else {
      // Optionally update user properties (name, picture) if they changed
      const updatedUser = User.create({
        id: user.id,
        email: user.email,
        name: name || user.name,
        picture: picture || user.picture,
        googleId: user.googleId,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: new Date(),
      });
      user = await this.userRepository.save(updatedUser);
    }

    // 3. Generate JWT
    const token = this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: user.toJSON(),
      token,
    };
  }
}
