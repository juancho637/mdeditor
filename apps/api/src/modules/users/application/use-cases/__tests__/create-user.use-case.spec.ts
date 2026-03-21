import * as bcrypt from 'bcrypt';
import { CreateUserUseCase } from '../create-user.use-case';
import { UserRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    exception = {
      badRequestException: jest.fn().mockReturnValue(new Error('A user with this email already exists.')),
      unauthorizedException: jest.fn(),
      forbiddenException: jest.fn(),
      notFoundException: jest.fn(),
      conflictException: jest.fn(),
      internalServerErrorException: jest.fn(),
    };

    createUserUseCase = new CreateUserUseCase(userRepository, exception);
  });

  it('should create a user with hashed password', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (data) => ({
      id: 'uuid-1',
      name: data.name,
      email: data.email,
      isAdmin: data.isAdmin,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await createUserUseCase.run({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      isAdmin: false,
    });

    expect(result.id).toBe('uuid-1');
    expect(result.name).toBe('Test User');
    expect(result.email).toBe('test@test.com');
    expect(result.isAdmin).toBe(false);

    const createCall = userRepository.create.mock.calls[0]![0];
    const isHashValid = await bcrypt.compare('password123', createCall.passwordHash);
    expect(isHashValid).toBe(true);
  });

  it('should throw USR002 when email already exists', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'uuid-existing',
      name: 'Existing',
      email: 'test@test.com',
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      createUserUseCase.run({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        isAdmin: false,
      }),
    ).rejects.toThrow('A user with this email already exists.');

    expect(exception.badRequestException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ codeError: 'USR002' }),
        context: 'CreateUserUseCase',
      }),
    );
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
