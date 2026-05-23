import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { OrgsModule } from './orgs/orgs.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { DiscountsModule } from './discounts/discounts.module';
import { InventoryModule } from './inventory/inventory.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { CustomersModule } from './customers/customers.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { BillsModule } from './bills/bills.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, UsersModule, AuthModule, RolesModule, OrgsModule, ProductsModule, CategoriesModule, BrandsModule, DiscountsModule, InventoryModule, SuppliersModule, PurchaseOrdersModule, CustomersModule, LoyaltyModule, BillsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
