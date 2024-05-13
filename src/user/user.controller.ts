import { ClassSerializerInterceptor, Controller, Get, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from './user';
import { RedisService } from 'src/shared/redis.service';
import { Response } from 'express';

@UseGuards(AuthGuard)
@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private redisService: RedisService
    ) { }

    @Get('admin/ambassadors')
    async ambassadors() {
        return this.userService.find({
            where: { is_ambassador: true }
        })
    }

    @Get('ambassador/rankings')
    async rankings(
        @Res() response: Response
    ) {
        // const ambassadors: User[] = await this.userService.find({
        //     where: { is_ambassador: true },
        //     relations: ['orders', 'orders.order_items']
        // });
        // return ambassadors.map(ambassador => {
        //     return {
        //         name: ambassador.name,
        //         revenue: ambassador.revenue
        //     }
        // })
        const client = this.redisService.getClient();
        client.zrevrangebyscore('rankings', '+inf', '-inf', 'withscores', (err, result) => {
            response.send(result.reduce((o, r, index, arr) => {
                // console.log(o)
                if (index % 2 === 0) {
                    if (isNaN(parseInt(arr[index + 1]))) {
                        o[r] = parseInt(arr[index + 2])
                    } else {
                        o[r] = parseInt(arr[index + 1])
                    }
                }
                return o;
            }, {}));
        });
    }
}
