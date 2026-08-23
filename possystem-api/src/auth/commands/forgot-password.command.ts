import { ICommand } from '@nestjs/cqrs';

export class ForgotPasswordCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly redirectTo?: string,
  ) {}
}
