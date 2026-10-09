import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoyaltyQuery } from './get-loyalty.query';

@QueryHandler(GetLoyaltyQuery)
export class GetLoyaltyHandler implements IQueryHandler<GetLoyaltyQuery> {
  execute(query: GetLoyaltyQuery): Promise<string> {
    const { id } = query;
    return Promise.resolve(`This action returns a #${id} loyalty`);
  }
}
