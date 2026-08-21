import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { CustomersService } from '../src/customers/customers.service';
import { DiscountsService } from '../src/discounts/discounts.service';
import { BillsService } from '../src/bills/bills.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PaymentMethod, BillStatus } from '@prisma/client';

describe('Phase 4: Customers, Discounts & Billing (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customersService: CustomersService;
  let discountsService: DiscountsService;
  let billsService: BillsService;

  // Keep track of IDs to clean up
  let orgId: string;
  let locationId: string;
  let cashierId: string;
  let categoryId: string;
  let productId: string;
  let batchId: string;
  let customerId: string;
  let discountId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    customersService = app.get<CustomersService>(CustomersService);
    discountsService = app.get<DiscountsService>(DiscountsService);
    billsService = app.get<BillsService>(BillsService);

    // Seed required entities
    // 1. Create a dummy cashier User
    const user = await prisma.user.create({
      data: {
        fullname: 'Test Cashier',
        email: `cashier_${Date.now()}@test.com`,
      },
    });
    cashierId = user.id;

    // 2. Create Business Category
    const bizCat = await prisma.businessCategory.create({
      data: { type: 'Retail' },
    });

    // 3. Create Org
    const org = await prisma.org.create({
      data: {
        owner_id: cashierId,
        businesscategory_id: bizCat.id,
        phone: '123456789',
      },
    });
    orgId = org.id;

    // 4. Create Location
    const loc = await prisma.inventoryLocation.create({
      data: {
        org_id: orgId,
        name: 'Main Branch',
        type: 'BRANCH',
      },
    });
    locationId = loc.id;

    // 5. Create ProductCategory
    const cat = await prisma.productCategory.create({
      data: { name: 'Electronics', level: 0 },
    });
    categoryId = cat.id;

    // 6. Create Product
    const prod = await prisma.product.create({
      data: {
        subcategoryid: categoryId,
        name: 'Test Product X',
        SKU: `SKU-${Date.now()}`,
        barcode: `BAR-${Date.now()}`,
      },
    });
    productId = prod.id;

    // 7. Create Product Price
    await prisma.productPrice.create({
      data: {
        productid: productId,
        price: 100.0,
        isdefault: true,
      },
    });

    // 8. Create Stock Batch
    const batch = await prisma.stockBatch.create({
      data: {
        product_id: productId,
        received_at_location_id: locationId,
        batch_number: 'BATCH-001',
        cost_price: 60.0,
        selling_price: 100.0,
        quantity_received: 50,
        created_by: cashierId,
      },
    });
    batchId = batch.id;

    // 9. Initialize Stock
    await prisma.inventoryStock.create({
      data: {
        batch_id: batchId,
        location_id: locationId,
        quantity_on_hand: 50,
      },
    });
  });

  afterAll(async () => {
    // Cleanup seeded entities in reverse dependency order
    await prisma.inventoryTransaction.deleteMany({ where: { location_id: locationId } });
    await prisma.inventoryStock.deleteMany({ where: { location_id: locationId } });
    await prisma.stockBatch.deleteMany({ where: { product_id: productId } });
    await prisma.productPrice.deleteMany({ where: { productid: productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.productCategory.deleteMany({ where: { id: categoryId } });
    await prisma.inventoryLocation.deleteMany({ where: { id: locationId } });
    await prisma.org.deleteMany({ where: { id: orgId } });
    await prisma.user.deleteMany({ where: { id: cashierId } });

    await app.close();
  });

  describe('1. Customers Service CRUD & Soft Delete', () => {
    it('should create, find, update, and soft delete a customer', async () => {
      // Create Customer
      const phone = `555-${Date.now()}`;
      const customer = await customersService.create({
        org_id: orgId,
        full_name: 'John Doe',
        phone,
        email: 'john@doe.com',
        is_loyalty_member: true,
      });

      expect(customer).toBeDefined();
      expect(customer.full_name).toBe('John Doe');
      customerId = customer.id;

      // Initialize Customer Credit Account (for subsequent tests)
      await prisma.customerCreditAccount.create({
        data: {
          customer_id: customerId,
          org_id: orgId,
          credit_limit: 500.0,
          current_balance: 0.0,
        },
      });

      // Find One
      const found = await customersService.findOne(customerId);
      expect(found).toBeDefined();
      expect(found.phone).toBe(phone);

      // Update
      const updated = await customersService.update(customerId, {
        full_name: 'Johnathan Doe',
      });
      expect(updated.full_name).toBe('Johnathan Doe');

      // Soft delete
      await customersService.remove(customerId);

      // Try finding again, should throw NotFoundException
      await expect(customersService.findOne(customerId)).rejects.toThrow();
      
      // Restore customer soft-delete state for billing tests
      await prisma.customer.update({
        where: { id: customerId },
        data: { deleted_at: null },
      });
    });
  });

  describe('2. Discounts Service CRUD & Validation', () => {
    it('should create and validate a coupon discount', async () => {
      const code = `SAVE20-${Date.now()}`;
      const discount = await discountsService.create({
        name: '20% OFF ORDER',
        type: 'PERCENTAGE',
        value: 20,
        scope: 'ORDER',
        coup_code: code,
        min_qty: 1,
        min_val: 50,
      });

      expect(discount).toBeDefined();
      expect(discount!.coup_code).toBe(code);
      discountId = discount!.id;

      // Validate valid coupon
      const result = await discountsService.validateCoupon(code, [
        {
          product_id: productId,
          category_id: categoryId,
          quantity: 1,
          unit_price: 100,
        },
      ]);
      expect(result.valid).toBe(true);
      expect(result.discount_amount).toBe(20); // 20% of 100

      // Validate failing min_val
      const resultFailVal = await discountsService.validateCoupon(code, [
        {
          product_id: productId,
          category_id: categoryId,
          quantity: 1,
          unit_price: 30, // Less than min_val of 50
        },
      ]);
      expect(resultFailVal.valid).toBe(false);

      // Clean up coupon
      await discountsService.remove(discountId);
    });
  });

  describe('3. POS Billing Engine calculations, stock, loyalty, and reversals', () => {
    it('should process a bill transaction with custom taxes and deduct stock, then revert on cancellation', async () => {
      // 1. Create a Coupon
      const code = `BILLCOUP-${Date.now()}`;
      const coupon = await discountsService.create({
        name: '$10 Fixed Discount',
        type: 'FIXED',
        value: 10,
        scope: 'ORDER',
        coup_code: code,
      });

      // 2. Setup Loyalty Config for org
      await prisma.loyaltyProgramConfig.upsert({
        where: { org_id: orgId },
        create: {
          org_id: orgId,
          points_per_rupee: 0.1, // 10 points for $100 spent
          rupee_value_per_point: 1.0,
        },
        update: {
          points_per_rupee: 0.1,
        },
      });

      // Check initial stock
      const initialStock = await prisma.inventoryStock.findUnique({
        where: { batch_id_location_id: { batch_id: batchId, location_id: locationId } },
      });
      expect(initialStock!.quantity_on_hand).toBe(50);

      // 3. Create a Bill (2 quantities of $100 item = $200 subtotal. $10 coupon = $190. 10% tax = $19. Grand total = $209)
      const bill = await billsService.create({
        org_id: orgId,
        location_id: locationId,
        customer_id: customerId,
        cashier_id: cashierId,
        coupon_code: code,
        taxes: [
          { name: 'VAT', rate: 10, is_active: true },
          { name: 'Service Tax', rate: 5, is_active: false }, // Inactive tax
        ],
        items: [
          {
            product_id: productId,
            quantity: 2,
          },
        ],
        payments: [
          {
            payment_method: PaymentMethod.CASH,
            amount: 209.0,
          },
        ],
      });

      expect(bill).toBeDefined();
      expect(bill.subtotal.toString()).toBe('200.00');
      expect(bill.discount_total.toString()).toBe('10.00');
      expect(bill.tax_total.toString()).toBe('19.00'); // 10% of $190
      expect(bill.grand_total.toString()).toBe('209.00');

      // Check stock was deducted
      const postStock = await prisma.inventoryStock.findUnique({
        where: { batch_id_location_id: { batch_id: batchId, location_id: locationId } },
      });
      expect(postStock!.quantity_on_hand).toBe(48); // 50 - 2

      // Check loyalty points earned (10% of 209.00 = 20.9 -> 20 points)
      const postCustomer = await prisma.customer.findUnique({ where: { id: customerId } });
      expect(postCustomer!.loyalty_points).toBe(20);
      expect(postCustomer!.total_visits).toBe(1);
      expect(Number(postCustomer!.total_spent)).toBe(209);

      // Check inventory transactions
      const txCount = await prisma.inventoryTransaction.count({
        where: { location_id: locationId, transaction_type: 'SALE' },
      });
      expect(txCount).toBe(1);

      // 4. Cancel/Refund the Bill
      const cancelledBill = await billsService.update(bill.id, {
        status: BillStatus.CANCELLED,
      });

      expect(cancelledBill.status).toBe(BillStatus.CANCELLED);

      // Check stock was restored
      const restoredStock = await prisma.inventoryStock.findUnique({
        where: { batch_id_location_id: { batch_id: batchId, location_id: locationId } },
      });
      expect(restoredStock!.quantity_on_hand).toBe(50); // Restored to 50

      // Check loyalty points reverted
      const revertedCustomer = await prisma.customer.findUnique({ where: { id: customerId } });
      expect(revertedCustomer!.loyalty_points).toBe(0); // Deducted back to 0
      expect(revertedCustomer!.total_visits).toBe(0); // Reverted metrics
      expect(Number(revertedCustomer!.total_spent)).toBe(0);

      // Clean up Coupon
      await discountsService.remove(coupon!.id);
      await prisma.customerCreditAccount.deleteMany({ where: { customer_id: customerId } });
      await prisma.customer.delete({ where: { id: customerId } });
      await billsService.remove(bill.id);
    });
  });
});
