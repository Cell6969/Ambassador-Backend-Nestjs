import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) { }

    async save(options: any) {
        return this.userRepository.save(options)
    }

    async find(options: any) {
        return this.userRepository.find(options);
    }

    async findOne(options: any) {
        return this.userRepository.findOne(options);
    }

    async update(id: number, options: any) {
        return this.userRepository.update(id, options);
    }
}
