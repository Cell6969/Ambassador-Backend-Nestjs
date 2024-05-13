import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    NotFoundException,
    Post,
    Put,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { RegisterDTO } from './dtos/register.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) { }

    @Post(['admin/register', 'ambassador/register'])
    async register(
        @Req() request: Request,
        @Body() body: RegisterDTO
    ) {
        const { password_confirm, ...data } = body;

        if (body.password !== body.password_confirm) {
            throw new BadRequestException("password do not match")
        }

        const hashed = await bcrypt.hash(body.password, 12)

        return this.userService.save({
            ...data,
            password: hashed,
            is_ambassador: request.path === '/api/ambassador/register'
        })
    }

    /**
     * Handles login requests for both admin and ambassador.
     * 
     * @param email The email of the user trying to log in.
     * @param password The password of the user trying to log in.
     * @param request The HTTP request object.
     * @param response The HTTP response object, used to set the JWT cookie.
     * @returns A success message if login is successful.
     * @throws NotFoundException if the user is not found.
     * @throws BadRequestException if the password does not match.
     * @throws UnauthorizedException if an ambassador tries to log in as admin.
     */
    @Post(['admin/login', 'ambassador/login'])
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response
    ) {
        const user = await this.userService.findOne({ where: { email: email } });
        if (!user) {
            throw new NotFoundException('User not found')
        }

        if (!await bcrypt.compare(password, user.password)) {
            throw new BadRequestException('Invalid Credentials')
        }

        const adminLogin = request.path === '/api/admin/login';

        if (user.is_ambassador && adminLogin) {
            throw new UnauthorizedException();
        }

        const jwt = await this.jwtService.signAsync({
            id: user.id,
            scope: adminLogin ? 'admin' : 'ambassador'
        })

        response.cookie('jwt', jwt, { httpOnly: true })
        return {
            message: 'success login'
        };
    }

    @UseGuards(AuthGuard)
    @Get(['admin/user', 'ambassador/user'])
    async user(@Req() request: Request) {
        const cookie = request.cookies['jwt']
        const { id } = await this.jwtService.verifyAsync(cookie);
        
        if (request.path === '/api/admin/user') {
            return this.userService.findOne({ where: { id: id } });
        }

        const user = await this.userService.findOne({
            where: {id: id}, 
            relations: ['orders', 'orders.order_items']
        });

        const {orders, password, ...data} = user;
        
        return  {
            ...data,
            revenue: user.revenue
        }
    }

    @UseGuards(AuthGuard)
    @Post(['admin/logout', 'ambassador/logout'])
    async logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie('jwt');
        return {
            message: "successfully logout"
        }
    }

    @UseGuards(AuthGuard)
    @Put(['admin/users/info', 'ambassador/users/info'])
    async updateInfo(
        @Req() request: Request,
        @Body('first_name') first_name: string,
        @Body('last_name') last_name: string,
        @Body('email') email: string
    ) {
        const cookie = request.cookies['jwt'];
        const { id } = await this.jwtService.verifyAsync(cookie);
        await this.userService.update(id, {
            first_name,
            last_name,
            email
        })
        return this.userService.findOne({ where: { id: id } });
    }

    @UseGuards(AuthGuard)
    @Put(['admin/users/password', 'ambassador/users/password'])
    async updatePassword(
        @Req() request: Request,
        @Body('password') password: string,
        @Body('password_confirm') password_confirm: string
    ) {
        if (password !== password_confirm) {
            throw new BadRequestException("password do not match")
        }

        const cookie = request.cookies['jwt'];
        const { id } = await this.jwtService.verifyAsync(cookie);
        await this.userService.update(id, {
            password: await bcrypt.hash(password, 12)
        })
        return this.userService.findOne({ id });
    }
}
