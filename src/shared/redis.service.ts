import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { RedisClient } from "redis";

import { Cache } from "cache-manager";

@Injectable()
export class RedisService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {
    }

    getClient(): RedisClient {
        const store: any = this.cacheManager.store;
        return store.getClient();
    }
}