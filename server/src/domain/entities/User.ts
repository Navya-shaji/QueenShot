export interface UserProps {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  gamesPlayed?: number;
  gamesWon?: number;
  gamesLost?: number;
  eloRating?: number;
  coinsCollected?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public id: string;
  public username: string;
  public email: string;
  public avatarUrl: string;
  public gamesPlayed: number;
  public gamesWon: number;
  public gamesLost: number;
  public eloRating: number;
  public coinsCollected: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username;
    this.email = props.email ?? '';
    this.avatarUrl = props.avatarUrl ?? 'https://api.dicebear.com/7.x/bottts/svg?seed=DefaultStriker';
    this.gamesPlayed = props.gamesPlayed ?? 0;
    this.gamesWon = props.gamesWon ?? 0;
    this.gamesLost = props.gamesLost ?? 0;
    this.eloRating = props.eloRating ?? 1200;
    this.coinsCollected = props.coinsCollected ?? 0;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.validate();
  }

  private validate() {
    if (!this.username || this.username.trim().length === 0) {
      throw new Error('Username is required');
    }
    if (this.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (this.username.length > 25) {
      throw new Error('Username cannot exceed 25 characters');
    }
    if (this.email && !this.email.includes('@')) {
      throw new Error('Invalid email format');
    }
  }

  public updateProfile({ username, avatarUrl }: { username?: string; avatarUrl?: string }) {
    if (username !== undefined) this.username = username;
    if (avatarUrl !== undefined) this.avatarUrl = avatarUrl;
    this.validate();
  }

  public recordMatchResult(isWin: boolean, pucksPocketed: number, opponentElo: number) {
    this.gamesPlayed += 1;
    if (isWin) this.gamesWon += 1; else this.gamesLost += 1;
    this.coinsCollected += pucksPocketed ?? 0;
    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (opponentElo - this.eloRating) / 400));
    const actual = isWin ? 1 : 0;
    const change = Math.round(K * (actual - expected));
    this.eloRating += change;
    if (this.eloRating < 100) this.eloRating = 100;
  }
}
