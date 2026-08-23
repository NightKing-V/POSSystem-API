import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoyaltyQuery } from './get-loyalty.query';

@QueryHandler(GetLoyaltyQuery)
export class GetLoyaltyHandler implements IQueryHandler<GetLoyaltyQuery> {
  async execute(query: GetLoyaltyQuery) {
    const { id } = query;
    return `This action returns a #${id} loyalty`;
  }
}
