import { CommandHandler, CommandBus, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Logger } from '@nestjs/common';
import { DeleteOrgCommand } from './delete-org.command';
import { PrismaService } from '../../prisma/prisma.service';
import { DeleteBillCommand } from '../../bills/commands/delete-bill.command';
import { DeleteSupplierCommand } from '../../suppliers/commands/delete-supplier.command';
import { DeleteCustomerCommand } from '../../customers/commands/delete-customer.command';
import { DeleteInventoryCommand } from '../../inventory/commands/delete-inventory.command';

@CommandHandler(DeleteOrgCommand)
export class DeleteOrgHandler implements ICommandHandler<DeleteOrgCommand> {
  private readonly logger = new Logger(DeleteOrgHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: DeleteOrgCommand) {
    const { id } = command;
    this.logger.log(`Executing DeleteOrg workflow for orgId: ${id}`);

    const org = await this.prisma.org.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    // 1. Delete all bills under the organization
    // DeleteBillCommand handles bill items, bill payments, and bill transactions
    const bills = await this.prisma.bill.findMany({
      where: { org_id: id },
      select: { id: true },
    });
    this.logger.debug(`Found ${bills.length} bills under Org ${id}. Deleting...`);
    for (const bill of bills) {
      await this.commandBus.execute(new DeleteBillCommand(bill.id, true));
    }

    // 2. Delete purchase orders under the organization
    const pos = await this.prisma.purchaseOrder.findMany({
      where: { org_id: id },
      select: { id: true },
    });
    this.logger.debug(`Found ${pos.length} purchase orders under Org ${id}. Deleting...`);
    const poIds = pos.map((p) => p.id);
    if (poIds.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.purchaseOrderItem.deleteMany({ where: { po_id: { in: poIds } } });
        await tx.supplierCreditTransaction.deleteMany({ where: { po_id: { in: poIds } } });
        await tx.purchaseOrder.deleteMany({ where: { id: { in: poIds } } });
      });
    }

    // 3. Delete all suppliers under the organization
    // DeleteSupplierCommand unlinks products and cleans up supplier credit accounts/txs
    const suppliers = await this.prisma.supplier.findMany({
      where: { org_id: id },
      select: { id: true },
    });
    this.logger.debug(`Found ${suppliers.length} suppliers under Org ${id}. Deleting...`);
    for (const supplier of suppliers) {
      await this.commandBus.execute(new DeleteSupplierCommand(supplier.id, true));
    }

    // 4. Delete all customers under the organization
    // DeleteCustomerCommand with force=true deletes credit accounts/txs and loyalty txs
    const customers = await this.prisma.customer.findMany({
      where: { org_id: id },
      select: { id: true },
    });
    this.logger.debug(`Found ${customers.length} customers under Org ${id}. Deleting...`);
    for (const customer of customers) {
      await this.commandBus.execute(new DeleteCustomerCommand(customer.id, true));
    }

    // 5. Delete all inventory locations (branches/warehouses) under the organization
    // DeleteInventoryCommand with force=true automatically deletes all stocks,
    // inventory transactions, stock batches, and user locations under that location
    const locations = await this.prisma.inventoryLocation.findMany({
      where: { org_id: id },
      select: { id: true },
    });
    this.logger.debug(`Found ${locations.length} locations under Org ${id}. Deleting...`);
    for (const location of locations) {
      await this.commandBus.execute(new DeleteInventoryCommand(location.id, true));
    }

    // 6. Delete remaining Org-scoped catalog, discounts, configurations, roles, and the Org itself
    await this.prisma.$transaction(async (tx) => {
      // 6a. Discounts
      await tx.productDiscount.deleteMany({
        where: { discount: { org_id: id } },
      });
      await tx.categoryDiscount.deleteMany({
        where: { discount: { org_id: id } },
      });
      await tx.discount.deleteMany({ where: { org_id: id } });

      // 6b. Products & Prices
      await tx.productPrice.deleteMany({
        where: { product: { org_id: id } },
      });
      await tx.product.deleteMany({ where: { org_id: id } });

      // 6c. Brands
      await tx.brand.deleteMany({ where: { org_id: id } });

      // 6d. Product Categories (unlink parent_id first to satisfy self-relation FK)
      await tx.productCategory.updateMany({
        where: { org_id: id },
        data: { parent_id: null },
      });
      await tx.productCategory.deleteMany({ where: { org_id: id } });

      // 6e. Loyalty config, UserRoles, OrgRoles, and Org
      await tx.loyaltyProgramConfig.deleteMany({ where: { org_id: id } });
      await tx.userRole.deleteMany({ where: { org_id: id } });
      await tx.orgRolePermission.deleteMany({
        where: { org_role: { org_id: id } },
      });
      await tx.orgRole.deleteMany({ where: { org_id: id } });
      await tx.org.delete({ where: { id } });
    });

    this.logger.log(`Organization ${id} successfully deleted.`);
    return { success: true, message: `Organization ${id} deleted successfully.` };
  }
}

