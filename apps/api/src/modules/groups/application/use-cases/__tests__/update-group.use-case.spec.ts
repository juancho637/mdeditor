import { UpdateGroupUseCase } from '../update-group.use-case';
import { GroupRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('UpdateGroupUseCase', () => {
  let useCase: UpdateGroupUseCase;
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
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(), internalServerErrorException: jest.fn(),
    };
    useCase = new UpdateGroupUseCase(groupRepository, exception);
  });

  it('should update group name', async () => {
    groupRepository.findById.mockResolvedValue({ id: 'grp-1', name: 'Old', memberCount: 0, createdAt: new Date() });
    groupRepository.findByName.mockResolvedValue(null);
    groupRepository.update.mockResolvedValue({ id: 'grp-1', name: 'New', memberCount: 0, createdAt: new Date() });

    const result = await useCase.run('grp-1', 'New');
    expect(result.name).toBe('New');
  });

  it('should throw GRP002 when new name conflicts with another group', async () => {
    groupRepository.findById.mockResolvedValue({ id: 'grp-1', name: 'Old', memberCount: 0, createdAt: new Date() });
    groupRepository.findByName.mockResolvedValue({ id: 'grp-2', name: 'Taken', memberCount: 1, createdAt: new Date() });

    await expect(useCase.run('grp-1', 'Taken')).rejects.toThrow('A group with this name already exists.');
  });

  it('should throw GRP001 when group not found', async () => {
    groupRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('nonexistent', 'Name')).rejects.toThrow('Group not found.');
  });
});
