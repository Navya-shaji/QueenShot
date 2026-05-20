import { UserRole } from '../enums/UserRole';

export interface UserProps {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  googleId: string;
  createdAt: Date;
  updatedAt: Date;
  xp: number;
  gamesPlayed: number;
  wins: number;
}

export class User {
  private props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get picture(): string | undefined {
    return this.props.picture;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get googleId(): string {
    return this.props.googleId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get xp(): number {
    return this.props.xp;
  }

  get gamesPlayed(): number {
    return this.props.gamesPlayed;
  }

  get wins(): number {
    return this.props.wins;
  }

  public static create(
    props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'xp' | 'gamesPlayed' | 'wins'> &
      Partial<Pick<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'xp' | 'gamesPlayed' | 'wins'>>
  ): User {
    return new User({
      id: props.id || Math.random().toString(36).substring(2, 11),
      email: props.email,
      name: props.name,
      picture: props.picture,
      role: props.role || UserRole.USER,
      googleId: props.googleId,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      xp: props.xp ?? 0,
      gamesPlayed: props.gamesPlayed ?? 0,
      wins: props.wins ?? 0,
    });
  }

  public toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      picture: this.picture,
      role: this.role,
      googleId: this.googleId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      xp: this.xp,
      gamesPlayed: this.gamesPlayed,
      wins: this.wins,
    };
  }
}
