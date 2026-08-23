import { ICommand } from '@nestjs/cqrs';

export class ResetPasswordCommand implements ICommand {
  constructor(
    public readonly accessToken: string,
    public readonly newPassword: string,
  ) {}
}
