import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoyaltiesQuery } from './get-loyalties.query';

@QueryHandler(GetLoyaltiesQuery)
export class GetLoyaltiesHandler implements IQueryHandler<GetLoyaltiesQuery> {
  execute(): Promise<string> {
    return Promise.resolve(`This action returns all loyalty`);
  }
}
