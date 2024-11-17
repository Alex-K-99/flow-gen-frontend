export interface User {
  id?: number;
  uuid?: string;
  email?: string;
  password: string;
  username: string;
  sessionId?: string;
  sessionValidUntil?: Date;
}
