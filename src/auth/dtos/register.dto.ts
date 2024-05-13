import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterDTO {
    @IsNotEmpty()
    first_name: string;

    @IsNotEmpty()
    last_name: string;
    
    @IsNotEmpty()
    @IsEmail()
    email: string;
    
    @IsNotEmpty()
    password: string;
    
    @IsNotEmpty()
    password_confirm: string;
}