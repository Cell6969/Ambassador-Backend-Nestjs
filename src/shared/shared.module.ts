import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import * as redisStore from 'cache-manager-redis-store';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';


@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: process.env.JWT_EXPIRED }
        }),
        CacheModule.register({
            store: redisStore,
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT) || 6379
        })
    ],
    providers: [RedisService],
    exports: [JwtModule, CacheModule, RedisService]
})
export class SharedModule { }
