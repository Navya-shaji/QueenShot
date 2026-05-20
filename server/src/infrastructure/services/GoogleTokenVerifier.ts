import { OAuth2Client, TokenPayload } from 'google-auth-library';

export class GoogleTokenVerifier {
  private client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    this.client = new OAuth2Client(clientId);
  }

  async verify(idToken: string): Promise<TokenPayload | undefined> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      return ticket.getPayload();
    } catch (error: any) {
      console.error('Google token verification failed:', error);
      throw new Error(`Google token verification failed: ${error.message}`);
    }
  }
}
