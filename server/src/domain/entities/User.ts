import { UserRole } from '../enums/UserRole';

export interface UserProps {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  picture?: string;
  role?: UserRole;
  googleId?: string;
  xp?: number;
  gamesPlayed?: number;
  gamesWon?: number;
  wins?: number;
  gamesLost?: number;
  eloRating?: number;
  coinsCollected?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public id: string;
  public username: string;
  public name: string;
  public email: string;
  public avatarUrl: string;
  public picture: string;
  public role: UserRole;
  public googleId: string;
  public xp: number;
  public gamesPlayed: number;
  public gamesWon: number;
  public wins: number;
  public gamesLost: number;
  public eloRating: number;
  public coinsCollected: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username || props.name || 'Player';
    this.name = props.name || props.username || 'Player';
    this.email = props.email ?? '';
    this.avatarUrl = props.avatarUrl || props.picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=DefaultStriker';
    this.picture = props.picture || this.avatarUrl;
    this.role = props.role ?? UserRole.USER;
    this.googleId = props.googleId ?? '';
    this.xp = props.xp ?? 0;
    this.gamesPlayed = props.gamesPlayed ?? 0;
    this.gamesWon = props.gamesWon ?? props.wins ?? 0;
    this.wins = props.wins ?? props.gamesWon ?? 0;
    this.gamesLost = props.gamesLost ?? 0;
    this.eloRating = props.eloRating ?? 1200;
    this.coinsCollected = props.coinsCollected ?? 0;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.validate();
  }

  private validate() {
    if (!this.username || this.username.trim().length === 0) {
      throw new Error('Username is required');
    }
  }

  public updateProfile({ username, avatarUrl }: { username?: string; avatarUrl?: string }) {
    if (username !== undefined) {
      this.username = username;
      this.name = username;
    }
    if (avatarUrl !== undefined) {
      this.avatarUrl = avatarUrl;
      this.picture = avatarUrl;
    }
    this.validate();
  }

  public recordMatchResult(isWin: boolean, pucksPocketed: number, opponentElo: number) {
    this.gamesPlayed += 1;
    if (isWin) {
      this.gamesWon += 1;
      this.wins += 1;
    } else {
      this.gamesLost += 1;
    }
    this.coinsCollected += pucksPocketed ?? 0;
    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (opponentElo - this.eloRating) / 400));
    const actual = isWin ? 1 : 0;
    const change = Math.round(K * (actual - expected));
    this.eloRating += change;
    if (this.eloRating < 100) this.eloRating = 100;
  }

  public static create(
    props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'xp' | 'gamesPlayed' | 'wins'> &
      Partial<Pick<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'xp' | 'gamesPlayed' | 'wins'>>
  ): User {
    return new User({
      id: props.id || Math.random().toString(36).substring(2, 11),
      ...props
    });
  }

  public toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      username: this.username,
      picture: this.picture,
      avatarUrl: this.avatarUrl,
      role: this.role,
      googleId: this.googleId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      xp: this.xp,
      gamesPlayed: this.gamesPlayed,
      wins: this.wins,
      gamesWon: this.gamesWon,
      gamesLost: this.gamesLost,
      eloRating: this.eloRating,
      coinsCollected: this.coinsCollected
    };
  }
}
