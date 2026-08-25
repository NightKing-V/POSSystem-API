import { CommandHandler, CommandBus, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserWorkflowCommand } from './delete-user-workflow.command';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { DeleteBillCommand } from '../../bills/commands/delete-bill.command';
import { DeleteSupplierCommand } from '../../suppliers/commands/delete-supplier.command';
import { DeleteCustomerCommand } from '../../customers/commands/delete-customer.command';
import { DeleteInventoryCommand } from '../../inventory/commands/delete-inventory.command';
import { DeleteOrgCommand } from '../../orgs/commands/delete-org.command';
import { DeleteUserCommand } from '../../users/commands/delete-user.command';

@CommandHandler(DeleteUserWorkflowCommand)
export class DeleteUserWorkflowHandler implements ICommandHandler<DeleteUserWorkflowCommand> {
  private readonly logger = new Logger(DeleteUserWorkflowHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: DeleteUserWorkflowCommand) {
    const { userId } = command;
    this.logger.log(`Executing non-atomic DeleteUserWorkflow for userId: ${userId}`);

    // 1. Find all organizations owned by the user
    const ownedOrgs = await this.prisma.org.findMany({
      where: { owner_id: userId },
    });

    // 2. Loop through each organization and orchestrate child deletions
    for (const org of ownedOrgs) {
      this.logger.log(`Orchestrating cascading deletion of records under Org: ${org.id}`);

      // a. Delete all bills under the organization
      const bills = await this.prisma.bill.findMany({
        where: { org_id: org.id },
      });
      this.logger.debug(`Found ${bills.length} bills under Org ${org.id}. Deleting...`);
      for (const bill of bills) {
        await this.commandBus.execute(new DeleteBillCommand(bill.id, true));
      }

      // b. Delete all suppliers under the organization
      const suppliers = await this.prisma.supplier.findMany({
        where: { org_id: org.id },
      });
      this.logger.debug(`Found ${suppliers.length} suppliers under Org ${org.id}. Deleting...`);
      for (const supplier of suppliers) {
        await this.commandBus.execute(new DeleteSupplierCommand(supplier.id, true));
      }

      // c. Delete all customers under the organization
      const customers = await this.prisma.customer.findMany({
        where: { org_id: org.id },
      });
      this.logger.debug(`Found ${customers.length} customers under Org ${org.id}. Deleting...`);
      for (const customer of customers) {
        await this.commandBus.execute(new DeleteCustomerCommand(customer.id, true));
      }

      // d. Delete all inventory locations under the organization
      const locations = await this.prisma.inventoryLocation.findMany({
        where: { org_id: org.id },
      });
      this.logger.debug(`Found ${locations.length} locations under Org ${org.id}. Deleting...`);
      for (const location of locations) {
        await this.commandBus.execute(new DeleteInventoryCommand(location.id, true));
      }

      // e. Finally, delete the Organization itself using the atomic Org deletion command
      this.logger.debug(`Executing DeleteOrgCommand for Org ${org.id}`);
      await this.commandBus.execute(new DeleteOrgCommand(org.id));
    }

    // 3. Delete the user itself (and identity provider credentials) using the atomic User deletion command
    this.logger.log(`Executing DeleteUserCommand for userId: ${userId}`);
    await this.commandBus.execute(new DeleteUserCommand(userId));

    return { message: 'User and all nested service records deleted successfully.' };
  }
}
