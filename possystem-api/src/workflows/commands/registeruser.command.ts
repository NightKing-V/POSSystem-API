import { ICommand } from '@nestjs/cqrs';

export class RegisterUserCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly fullname?: string,
    public readonly phone?: string,
  ) {}
}
