import { GetInvitationByTokenUseCase } from '../get-invitation-by-token.use-case';
import { InvitationRepositoryInterface, InvitationStatus } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('GetInvitationByTokenUseCase', () => {
  let useCase: GetInvitationByTokenUseCase;
  let invitationRepository: jest.Mocked<InvitationRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    invitationRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      findPendingByEmail: jest.fn(),
      findAll: jest.fn(),
      markAccepted: jest.fn(),
    };

    exception = {
      badRequestException: jest.fn(),
      unauthorizedException: jest.fn(),
      forbiddenException: jest.fn(),
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(),
      internalServerErrorException: jest.fn(),
    };

    useCase = new GetInvitationByTokenUseCase(invitationRepository, exception);
  });

  it('should return invitation when token exists', async () => {
    const mockInvitation = {
      id: 'inv-1', email: 'test@test.com', token: 'valid-token',
      status: InvitationStatus.PENDING, invitedBy: 'admin-1',
      createdAt: new Date(), acceptedAt: null,
    };
    invitationRepository.findByToken.mockResolvedValue(mockInvitation);

    const result = await useCase.run('valid-token');

    expect(result.email).toBe('test@test.com');
    expect(result.status).toBe(InvitationStatus.PENDING);
  });

  it('should throw INV001 when token not found', async () => {
    invitationRepository.findByToken.mockResolvedValue(null);

    await expect(useCase.run('nonexistent')).rejects.toThrow('Invitation not found.');

    expect(exception.notFoundException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ codeError: 'INV001' }),
      }),
    );
  });
});
