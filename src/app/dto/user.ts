export interface User {
  id: number;
  uuid?: string;
  email?: string;
  passwordHash: string;
  username: string;
  sessionId: string;
  sessionValidUntil?: Date;
}
