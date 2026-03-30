import { SetupUseCase } from '../setup.use-case';
import { UserRepositoryInterface } from '@modules/users/domain';
import { AuthServiceInterface } from '../../../domain';
import { CreateUserUseCase } from '@modules/users/application';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('SetupUseCase', () => {
  let setupUseCase: SetupUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let authService: jest.Mocked<AuthServiceInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    createUserUseCase = { run: jest.fn() } as jest.Mocked<
      Pick<CreateUserUseCase, 'run'>
    > as jest.Mocked<CreateUserUseCase>;
    authService = { generateTokens: jest.fn() };

    exception = {
      badRequestException: jest
        .fn()
        .mockReturnValue(new Error('Setup already completed.')),
      unauthorizedException: jest.fn(),
      forbiddenException: jest.fn(),
      notFoundException: jest.fn(),
      conflictException: jest.fn(),
      internalServerErrorException: jest.fn(),
    };

    setupUseCase = new SetupUseCase(
      userRepository,
      createUserUseCase,
      authService,
      exception,
    );
  });

  it('should create admin user and return tokens when no users exist', async () => {
    userRepository.count.mockResolvedValue(0);
    createUserUseCase.run.mockResolvedValue({
      id: 'uuid-1',
      name: 'Admin',
      email: 'admin@test.com',
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    authService.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await setupUseCase.run({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(createUserUseCase.run).toHaveBeenCalledWith({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      isAdmin: true,
    });
  });

  it('should throw AUT003 when users already exist', async () => {
    userRepository.count.mockResolvedValue(1);

    await expect(
      setupUseCase.run({
        name: 'Admin',
        email: 'admin@test.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Setup already completed.');

    expect(exception.badRequestException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ codeError: 'AUT003' }),
        context: 'SetupUseCase',
      }),
    );
    expect(createUserUseCase.run).not.toHaveBeenCalled();
  });
});
