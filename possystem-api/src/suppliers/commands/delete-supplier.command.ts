import { ICommand } from '@nestjs/cqrs';

export class DeleteSupplierCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly force?: boolean,
  ) {}
}
