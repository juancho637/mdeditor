import { SignInUseCase } from '../sign-in.use-case';
import { UserRepositoryInterface } from '@modules/users/domain';
import { AuthServiceInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('SignInUseCase', () => {
  let signInUseCase: SignInUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let authService: jest.Mocked<AuthServiceInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  const mockUserWithPassword = {
    id: 'uuid-1',
    name: 'Admin',
    email: 'admin@test.com',
    passwordHash: 'hashed-password',
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    authService = { generateTokens: jest.fn() };

    exception = {
      badRequestException: jest.fn().mockReturnValue(new Error('Invalid credentials.')),
      unauthorizedException: jest.fn(),
      forbiddenException: jest.fn(),
      notFoundException: jest.fn(),
      conflictException: jest.fn(),
      internalServerErrorException: jest.fn(),
    };

    signInUseCase = new SignInUseCase(userRepository, authService, exception);
  });

  it('should return tokens when credentials are valid', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(mockUserWithPassword);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    authService.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await signInUseCase.run({
      email: 'admin@test.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith('admin@test.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(authService.generateTokens).toHaveBeenCalledWith({
      sub: 'uuid-1',
      name: 'Admin',
      email: 'admin@test.com',
      isAdmin: true,
    });
  });

  it('should normalize email to lowercase before lookup', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(mockUserWithPassword);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    authService.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    await signInUseCase.run({
      email: '  Admin@Test.COM  ',
      password: 'password123',
    });

    expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith('admin@test.com');
  });

  it('should throw AUT001 when email not found (still runs bcrypt for timing attack prevention)', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      signInUseCase.run({ email: 'unknown@test.com', password: 'password123' }),
    ).rejects.toThrow('Invalid credentials.');

    expect(exception.badRequestException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ codeError: 'AUT001' }),
        context: 'SignInUseCase',
      }),
    );
    // bcrypt.compare IS called with dummy hash to prevent timing attacks
    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it('should throw AUT001 when password is incorrect (same error as email not found)', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(mockUserWithPassword);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      signInUseCase.run({ email: 'admin@test.com', password: 'wrong-password' }),
    ).rejects.toThrow('Invalid credentials.');

    expect(exception.badRequestException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ codeError: 'AUT001' }),
        context: 'SignInUseCase',
      }),
    );
    expect(authService.generateTokens).not.toHaveBeenCalled();
  });
});
