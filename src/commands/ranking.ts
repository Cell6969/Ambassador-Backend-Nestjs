import { NestFactory } from "@nestjs/core"
import { AppModule } from "src/app.module"
import { RedisService } from "src/shared/redis.service";
import { User } from "src/user/user";
import { UserService } from "src/user/user.service";

(async () => {
    const app = await NestFactory.createApplicationContext(AppModule);

    const redisService = app.get(RedisService);
    const userService = app.get(UserService);

    const ambassadors: User[] = await userService.find({
        where: { is_ambassador: true },
        relations: ['orders', 'orders.order_items']
    })
    const client = redisService.getClient();

    for (let i = 0; i < ambassadors.length; i++) {
        // console.log(ambassadors[i].name, ambassadors[i].revenue)
        await client.zadd('rankings', ambassadors[i].revenue, ambassadors[i].name);
    }

    process.exit()
})()