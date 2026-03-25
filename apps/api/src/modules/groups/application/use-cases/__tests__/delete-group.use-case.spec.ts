import { DeleteGroupUseCase } from '../delete-group.use-case';
import { GroupRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('DeleteGroupUseCase', () => {
  let useCase: DeleteGroupUseCase;
  let groupRepository: jest.Mocked<GroupRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    groupRepository = {
      create: jest.fn(), findById: jest.fn(), findByIdWithMembers: jest.fn(),
      findByName: jest.fn(), findAll: jest.fn(), update: jest.fn(), delete: jest.fn(),
      addUser: jest.fn(), removeUser: jest.fn(), isUserInGroup: jest.fn(), findMembers: jest.fn(),
    };
    exception = {
      badRequestException: jest.fn(), unauthorizedException: jest.fn(), forbiddenException: jest.fn(),
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(), internalServerErrorException: jest.fn(),
    };
    useCase = new DeleteGroupUseCase(groupRepository, exception);
  });

  it('should delete group when it exists', async () => {
    groupRepository.findById.mockResolvedValue({ id: 'grp-1', name: 'Marketing', memberCount: 0, createdAt: new Date() });
    await useCase.run('grp-1');
    expect(groupRepository.delete).toHaveBeenCalledWith('grp-1');
  });

  it('should throw GRP001 when group not found', async () => {
    groupRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('nonexistent')).rejects.toThrow('Group not found.');
    expect(groupRepository.delete).not.toHaveBeenCalled();
  });
});
