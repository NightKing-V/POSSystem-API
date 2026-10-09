import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteOrgHandler } from './delete-org.handler';
import { DeleteOrgCommand } from './delete-org.command';
import { PrismaService } from '../../prisma/prisma.service';
import { DeleteBillCommand } from '../../bills/commands/delete-bill.command';
import { DeleteSupplierCommand } from '../../suppliers/commands/delete-supplier.command';
import { DeleteCustomerCommand } from '../../customers/commands/delete-customer.command';
import { DeleteInventoryCommand } from '../../inventory/commands/delete-inventory.command';

describe('DeleteOrgHandler', () => {
  let handler: DeleteOrgHandler;
  let prisma: any;
  let commandBus: any;

  const mockPrisma = {
    org: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    bill: {
      findMany: jest.fn(),
    },
    purchaseOrder: {
      findMany: jest.fn(),
    },
    supplier: {
      findMany: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
    },
    inventoryLocation: {
      findMany: jest.fn(),
    },
    loyaltyProgramConfig: {
      deleteMany: jest.fn(),
    },
    userRole: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) =>
      callback({
        purchaseOrderItem: { deleteMany: jest.fn() },
        supplierCreditTransaction: { deleteMany: jest.fn() },
        purchaseOrder: { deleteMany: jest.fn() },
        productDiscount: { deleteMany: jest.fn() },
        categoryDiscount: { deleteMany: jest.fn() },
        discount: { deleteMany: jest.fn() },
        productPrice: { deleteMany: jest.fn() },
        product: { deleteMany: jest.fn() },
        brand: { deleteMany: jest.fn() },
        productCategory: { updateMany: jest.fn(), deleteMany: jest.fn() },
        loyaltyProgramConfig: { deleteMany: jest.fn() },
        userRole: { deleteMany: jest.fn() },
        orgRolePermission: { deleteMany: jest.fn() },
        orgRole: { deleteMany: jest.fn() },
        org: { delete: jest.fn() },
      }),
    ),
  };

  const mockCommandBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteOrgHandler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CommandBus, useValue: mockCommandBus },
      ],
    }).compile();

    handler = module.get<DeleteOrgHandler>(DeleteOrgHandler);
    prisma = module.get<PrismaService>(PrismaService);
    commandBus = module.get<CommandBus>(CommandBus);

    jest.clearAllMocks();
  });

  it('should throw NotFoundException if organization does not exist', async () => {
    prisma.org.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteOrgCommand('non-existent-id')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should orchestrate cascading deletion via domain commands and transaction', async () => {
    prisma.org.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.bill.findMany.mockResolvedValue([
      { id: 'bill-1' },
      { id: 'bill-2' },
    ]);
    prisma.purchaseOrder.findMany.mockResolvedValue([{ id: 'po-1' }]);
    prisma.supplier.findMany.mockResolvedValue([{ id: 'sup-1' }]);
    prisma.customer.findMany.mockResolvedValue([{ id: 'cust-1' }]);
    prisma.inventoryLocation.findMany.mockResolvedValue([{ id: 'loc-1' }]);

    const result = await handler.execute(new DeleteOrgCommand('org-1'));

    // Verify deletion commands dispatched
    expect(commandBus.execute).toHaveBeenCalledWith(
      new DeleteBillCommand('bill-1', true),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      new DeleteBillCommand('bill-2', true),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      new DeleteSupplierCommand('sup-1', true),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      new DeleteCustomerCommand('cust-1', true),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      new DeleteInventoryCommand('loc-1', true),
    );

    // Verify transaction executed
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'Organization org-1 deleted successfully.',
    });
  });
});
