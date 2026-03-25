import { AcceptInvitationUseCase } from '../accept-invitation.use-case';
import { InvitationRepositoryInterface, InvitationStatus } from '../../../domain';
import { AuthServiceInterface } from '@modules/auth/domain';
import { CreateUserUseCase } from '@modules/users/application';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('AcceptInvitationUseCase', () => {
  let useCase: AcceptInvitationUseCase;
  let invitationRepository: jest.Mocked<InvitationRepositoryInterface>;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let authService: jest.Mocked<AuthServiceInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  const mockPendingInvitation = {
    id: 'inv-1',
    email: 'invited@test.com',
    token: 'valid-token',
    status: InvitationStatus.PENDING,
    invitedBy: 'admin-1',
    createdAt: new Date(),
    acceptedAt: null,
  };

  beforeEach(() => {
    invitationRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      findPendingByEmail: jest.fn(),
      findAll: jest.fn(),
      markAccepted: jest.fn(),
    };

    createUserUseCase = { run: jest.fn() } as any;
    authService = { generateTokens: jest.fn() };

    exception = {
      badRequestException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      unauthorizedException: jest.fn(),
      forbiddenException: jest.fn(),
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(),
      internalServerErrorException: jest.fn(),
    };

    useCase = new AcceptInvitationUseCase(invitationRepository, createUserUseCase, authService, exception);
  });

  it('should accept invitation, create user, and return tokens', async () => {
    invitationRepository.findByToken.mockResolvedValue(mockPendingInvitation);
    createUserUseCase.run.mockResolvedValue({
      id: 'user-new', name: 'Invited User', email: 'invited@test.com',
      isAdmin: false, createdAt: new Date(), updatedAt: new Date(),
    });
    authService.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await useCase.run({
      token: 'valid-token',
      name: 'Invited User',
      password: 'password123',
    });

    expect(result.accessToken).toBe('access-token');
    expect(createUserUseCase.run).toHaveBeenCalledWith({
      name: 'Invited User',
      email: 'invited@test.com',
      password: 'password123',
      isAdmin: false,
    });
    expect(invitationRepository.markAccepted).toHaveBeenCalledWith('inv-1');
  });

  it('should throw INV001 when invitation not found', async () => {
    invitationRepository.findByToken.mockResolvedValue(null);

    await expect(
      useCase.run({ token: 'nonexistent', name: 'Name', password: 'password123' }),
    ).rejects.toThrow('Invitation not found.');

    expect(createUserUseCase.run).not.toHaveBeenCalled();
  });

  it('should throw INV002 when invitation already accepted', async () => {
    invitationRepository.findByToken.mockResolvedValue({
      ...mockPendingInvitation,
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    await expect(
      useCase.run({ token: 'valid-token', name: 'Name', password: 'password123' }),
    ).rejects.toThrow('This invitation has already been used.');

    expect(createUserUseCase.run).not.toHaveBeenCalled();
  });
});
