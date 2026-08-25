import { ICommand } from '@nestjs/cqrs';

export class DeleteBillCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly force?: boolean,
  ) {}
}
