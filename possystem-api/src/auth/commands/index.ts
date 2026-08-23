export * from './login.command';
export * from './login.handler';
export * from './forgot-password.command';
export * from './forgot-password.handler';
export * from './reset-password.command';
export * from './reset-password.handler';

import { LoginHandler } from './login.handler';
import { ForgotPasswordHandler } from './forgot-password.handler';
import { ResetPasswordHandler } from './reset-password.handler';

export const AuthCommandHandlers = [
  LoginHandler,
  ForgotPasswordHandler,
  ResetPasswordHandler,
];
