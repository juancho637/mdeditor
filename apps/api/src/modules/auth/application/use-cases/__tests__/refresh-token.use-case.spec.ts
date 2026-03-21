import { RefreshTokenUseCase } from '../refresh-token.use-case';
import { UserRepositoryInterface } from '@modules/users/domain';
import { AuthServiceInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let authService: jest.Mocked<AuthServiceInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'uuid-1',
    name: 'Admin',
    email: 'admin@test.com',
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as any;

    userRepository = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    authService = { generateTokens: jest.fn() };

    exception = {
      badRequestException: jest.fn(),
      unauthorizedException: jest.fn().mockReturnValue(new Error('Unauthorized.')),
      forbiddenException: jest.fn(),
      notFoundException: jest.fn(),
      conflictException: jest.fn(),
      internalServerErrorException: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn().mockReturnValue('refresh-secret'),
    } as any;

    refreshTokenUseCase = new RefreshTokenUseCase(
      jwtService, userRepository, authService, exception, configService,
    );
  });

  it('should return new tokens when refresh token is valid', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'uuid-1',
      email: 'admin@test.com',
      isAdmin: true,
      typ: 'refresh',
    });
    userRepository.findById.mockResolvedValue(mockUser);
    authService.generateTokens.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const result = await refreshTokenUseCase.run('valid-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
      secret: 'refresh-secret',
    });
    expect(userRepository.findById).toHaveBeenCalledWith('uuid-1');
    expect(authService.generateTokens).toHaveBeenCalledWith({
      sub: 'uuid-1',
      email: 'admin@test.com',
      isAdmin: true,
    });
  });

  it('should throw AUT002 when refresh token is invalid', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(
      refreshTokenUseCase.run('invalid-token'),
    ).rejects.toThrow('Unauthorized.');

    expect(exception.unauthorizedException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ codeError: 'AUT002' }),
        context: 'RefreshTokenUseCase',
      }),
    );
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw AUT002 when user no longer exists', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'uuid-deleted',
      email: 'deleted@test.com',
      isAdmin: false,
      typ: 'refresh',
    });
    userRepository.findById.mockResolvedValue(null);

    await expect(
      refreshTokenUseCase.run('valid-but-user-deleted'),
    ).rejects.toThrow('Unauthorized.');

    expect(exception.unauthorizedException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ codeError: 'AUT002' }),
        context: 'RefreshTokenUseCase',
      }),
    );
    expect(authService.generateTokens).not.toHaveBeenCalled();
  });

  it('should throw AUT002 when token type is not refresh (access token used as refresh)', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'uuid-1',
      email: 'admin@test.com',
      isAdmin: true,
      typ: 'access',
    });

    await expect(
      refreshTokenUseCase.run('access-token-used-as-refresh'),
    ).rejects.toThrow('Unauthorized.');

    expect(exception.unauthorizedException).toHaveBeenCalled();
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw AUT002 when payload is missing sub field', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      email: 'admin@test.com',
      isAdmin: true,
      typ: 'refresh',
    });

    await expect(
      refreshTokenUseCase.run('token-without-sub'),
    ).rejects.toThrow('Unauthorized.');

    expect(exception.unauthorizedException).toHaveBeenCalled();
    expect(userRepository.findById).not.toHaveBeenCalled();
  });
});
