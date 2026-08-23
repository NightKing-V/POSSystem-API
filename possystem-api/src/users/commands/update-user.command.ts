import { ICommand } from '@nestjs/cqrs';
import { UpdateUserDto } from '../dto/update-user.dto';

export class UpdateUserCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateUserDto: UpdateUserDto,
  ) {}
}
