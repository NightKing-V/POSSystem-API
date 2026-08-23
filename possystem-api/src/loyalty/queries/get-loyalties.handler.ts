import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoyaltiesQuery } from './get-loyalties.query';

@QueryHandler(GetLoyaltiesQuery)
export class GetLoyaltiesHandler implements IQueryHandler<GetLoyaltiesQuery> {
  async execute() {
    return `This action returns all loyalty`;
  }
}
