import { Injectable } from "@nestjs/common";
import { Order } from "../order";
import { OnEvent } from "@nestjs/event-emitter";
import { RedisService } from "src/shared/redis.service";
import { MailerService } from "@nestjs-modules/mailer";


@Injectable()
export class OrderListener {
    constructor(
        private readonly rediService: RedisService,
        private readonly mailerService: MailerService
    ) { }

    @OnEvent('order.completed')
    async handleOrderCompletedEvent(order: Order) {
        const client = this.rediService.getClient();
        client.zincrby('rankings', order.ambassador_revenue, order.user.name);

        await this.mailerService.sendMail({
            to: 'admin@admin.com',
            subject: 'An order has been completed',
            html: `Order #${order.id} with a total of $${order.total} has been completed!`
        });

        await this.mailerService.sendMail({
            to: order.ambassador_email,
            subject: 'An order has been completed',
            html: `You earned $${order.ambassador_revenue} from the link #${order.code}`
        })
    }
};