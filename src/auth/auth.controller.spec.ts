import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRequest: Partial<Request>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    mockRequest = {
      path: '/api/ambassador/register'
    };
  });

  it('should successfully register a user', async () => {
    const result = await controller.register(mockRequest as Request, {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      password_confirm: 'password123'
    });

    expect(result).toBeDefined();
    expect(result.password).not.toBe('password123'); // Assuming password is hashed
  });

  it('should throw error if passwords do not match', async () => {
    await expect(controller.register(mockRequest as Request, {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      password_confirm: 'password321'
    })).rejects.toThrow(BadRequestException);
  });
});
