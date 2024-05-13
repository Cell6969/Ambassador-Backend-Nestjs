import { BadRequestException, Body, ClassSerializerInterceptor, Controller, Get, NotFoundException, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateOrderDTO } from './dtos/create-order.dto';
import { LinkService } from 'src/link/link.service';
import { Order } from './order';
import { Link } from 'src/link/link';
import { ProductService } from 'src/product/product.service';
import { OrderItem } from './order-items';
import { Product } from 'src/product/product';
import { OrderItemService } from './order-item.service';
import { Connection } from 'typeorm';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller()
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly orderItemService: OrderItemService,
        private readonly linkService: LinkService,
        private readonly productService: ProductService,
        private readonly connection: Connection,
        @InjectStripe() private readonly stripeClient: Stripe,
        private readonly configService: ConfigService,
        private eventEmitter: EventEmitter2
    ) { }

    @UseGuards(AuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('admin/orders')
    async all() {
        return this.orderService.find({ relations: ['order_items'] })
    }

    @Post('checkout/orders')
    async create(
        @Body() body: CreateOrderDTO
    ) {
        const link: Link = await this.linkService.findOne({
            where: { code: body.code },
            relations: ['user']
        })

        if (!link) {
            throw new BadRequestException('invalid code')
        }

        const queryRunner = this.connection.createQueryRunner();

        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            const order = new Order();
            // set order object
            order.user_id = link.user.id;
            order.ambassador_email = link.user.email;
            order.first_name = body.first_name;
            order.last_name = body.last_name;
            order.email = body.email;
            order.address = body.address;
            order.country = body.country;
            order.city = body.city;
            order.zip = body.zip;
            order.code = body.code;

            const newOrder = await queryRunner.manager.save(order);

            const line_items = [];

            for (let p of body.products) {
                const product: Product = await this.productService.findOne({
                    where: { id: p.product_id }
                })
                const orderItem = new OrderItem();
                // set orderItem
                orderItem.order = newOrder;
                orderItem.product_title = product.title;
                orderItem.price = product.price;
                orderItem.quantity = p.quantity;
                orderItem.ambassador_revenue = 0.1 * product.price * p.quantity;
                orderItem.admin_revenue = 0.9 * product.price * p.quantity;

                await queryRunner.manager.save(orderItem);

                line_items.push({
                    price_data: {
                        currency: 'usd',
                        unit_amount: 100 * product.price,
                        product_data: {
                            name: product.title,
                            description: product.description,
                            images: [product.image]
                        }
                    },
                    quantity: p.quantity
                })
            }

            const source = await this.stripeClient.checkout.sessions.create({
                mode: 'payment',
                payment_method_types: ['card'],
                line_items,
                success_url: `${this.configService.get('CHECKOUT_URL')}/success?source={CHECKOUT_SESSION_ID}`,
                cancel_url: `${this.configService.get('CHECKOUT_URL')}/error`
            });

            newOrder.transaction_id = source['id']
            await queryRunner.manager.save(newOrder);

            await queryRunner.commitTransaction();
            return source;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException()
        } finally {
            await queryRunner.release();
        }
    }

    @Post('checkout/orders/confirm')
    async confirm(@Body('source') source: string) {
        const order:Order = await this.orderService.findOne({
            where: { transaction_id: source },
            relations: ['user','order_items']
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        };

        console.log(order.user.name);

        await this.orderService.update(order.id, { complete: true });
        await this.eventEmitter.emit('order.completed', order);
        return {
            message: 'success'
        }
    }
}
