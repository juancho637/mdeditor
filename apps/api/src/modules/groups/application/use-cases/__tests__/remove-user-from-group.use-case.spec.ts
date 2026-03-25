import { RemoveUserFromGroupUseCase } from '../remove-user-from-group.use-case';
import { GroupRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('RemoveUserFromGroupUseCase', () => {
  let useCase: RemoveUserFromGroupUseCase;
  let groupRepository: jest.Mocked<GroupRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    groupRepository = {
      create: jest.fn(), findById: jest.fn(), findByIdWithMembers: jest.fn(),
      findByName: jest.fn(), findAll: jest.fn(), update: jest.fn(), delete: jest.fn(),
      addUser: jest.fn(), removeUser: jest.fn(), isUserInGroup: jest.fn(), findMembers: jest.fn(),
    };
    exception = {
      badRequestException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      unauthorizedException: jest.fn(), forbiddenException: jest.fn(),
      notFoundException: jest.fn(), conflictException: jest.fn(), internalServerErrorException: jest.fn(),
    };
    useCase = new RemoveUserFromGroupUseCase(groupRepository, exception);
  });

  it('should remove user from group', async () => {
    groupRepository.isUserInGroup.mockResolvedValue(true);
    await useCase.run('grp-1', 'usr-1');
    expect(groupRepository.removeUser).toHaveBeenCalledWith('grp-1', 'usr-1');
  });

  it('should throw GRP004 when user not in group', async () => {
    groupRepository.isUserInGroup.mockResolvedValue(false);
    await expect(useCase.run('grp-1', 'usr-1')).rejects.toThrow('User is not a member of this group.');
  });
});
