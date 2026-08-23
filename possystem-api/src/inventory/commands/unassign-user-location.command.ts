import { ICommand } from '@nestjs/cqrs';

export class UnassignUserLocationCommand implements ICommand {
  constructor(
    public readonly locationId: string,
    public readonly userId: string,
  ) {}
}
