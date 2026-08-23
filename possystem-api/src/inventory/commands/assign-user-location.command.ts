import { ICommand } from '@nestjs/cqrs';

export class AssignUserLocationCommand implements ICommand {
  constructor(
    public readonly locationId: string,
    public readonly userId: string,
    public readonly assignerId?: string,
  ) {}
}
