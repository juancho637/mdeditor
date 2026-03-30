import { CreateInvitationUseCase } from '../create-invitation.use-case';
import {
  InvitationRepositoryInterface,
  InvitationStatus,
} from '../../../domain';
import { UserRepositoryInterface } from '@modules/users/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('CreateInvitationUseCase', () => {
  let useCase: CreateInvitationUseCase;
  let invitationRepository: jest.Mocked<InvitationRepositoryInterface>;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    invitationRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      findPendingByEmail: jest.fn(),
      findAll: jest.fn(),
      markAccepted: jest.fn(),
    };

    userRepository = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    exception = {
      badRequestException: jest
        .fn()
        .mockImplementation(({ message }) => new Error(message.message)),
      unauthorizedException: jest.fn(),
      forbiddenException: jest.fn(),
      notFoundException: jest.fn(),
      conflictException: jest.fn(),
      internalServerErrorException: jest.fn(),
    };

    useCase = new CreateInvitationUseCase(
      invitationRepository,
      userRepository,
      exception,
    );
  });

  it('should create invitation when email is valid and not registered', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    invitationRepository.findPendingByEmail.mockResolvedValue(null);
    invitationRepository.create.mockResolvedValue({
      id: 'inv-1',
      email: 'new@test.com',
      token: 'uuid-token',
      status: InvitationStatus.PENDING,
      invitedBy: 'admin-1',
      createdAt: new Date(),
      acceptedAt: null,
    });

    const result = await useCase.run({
      email: 'New@Test.com',
      invitedBy: 'admin-1',
    });

    expect(result.email).toBe('new@test.com');
    expect(userRepository.findByEmail).toHaveBeenCalledWith('new@test.com');
    expect(invitationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@test.com', invitedBy: 'admin-1' }),
    );
  });

  it('should throw INV003 when email already has an account', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Existing',
      email: 'exists@test.com',
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.run({ email: 'exists@test.com', invitedBy: 'admin-1' }),
    ).rejects.toThrow('A user with this email already has an account.');

    expect(invitationRepository.create).not.toHaveBeenCalled();
  });

  it('should throw INV004 when pending invitation exists', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    invitationRepository.findPendingByEmail.mockResolvedValue({
      id: 'inv-old',
      email: 'pending@test.com',
      token: 'old-token',
      status: InvitationStatus.PENDING,
      invitedBy: 'admin-1',
      createdAt: new Date(),
      acceptedAt: null,
    });

    await expect(
      useCase.run({ email: 'pending@test.com', invitedBy: 'admin-1' }),
    ).rejects.toThrow('A pending invitation already exists for this email.');

    expect(invitationRepository.create).not.toHaveBeenCalled();
  });
});
