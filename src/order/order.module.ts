import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order';
import { OrderItem } from './order-items';
import { OrderItemService } from './order-item.service';
import { SharedModule } from 'src/shared/shared.module';
import { LinkModule } from 'src/link/link.module';
import { ProductModule } from 'src/product/product.module';
import { StripeModule } from 'nestjs-stripe';
import { ConfigModule } from '@nestjs/config';
import { OrderListener } from './listeners/order.listener';
import { MailerModule } from '@nestjs-modules/mailer';


@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Order, OrderItem]),
    SharedModule,
    LinkModule,
    ProductModule,
    StripeModule.forRoot({
      apiKey: process.env.STRIPE_KEY,
      apiVersion: '2024-04-10'
    }),
    MailerModule.forRoot({
      transport: {
        host: 'mailhog_container',
        port: 1025
      },
      defaults: {
        from: 'no-reply@example.com'
      }
    })
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderItemService, OrderListener]
})
export class OrderModule { }
