import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractService } from 'src/shared/abstract.service';
import { Link } from './link';
import { Repository } from 'typeorm';

@Injectable()
export class LinkService extends AbstractService{
    constructor(
        @InjectRepository(Link) private readonly linkRepository: Repository<Link>
    ) {
        super(linkRepository)
    }
}
