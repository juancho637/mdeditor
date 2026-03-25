import { CreateGroupUseCase } from '../create-group.use-case';
import { GroupRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('CreateGroupUseCase', () => {
  let useCase: CreateGroupUseCase;
  let groupRepository: jest.Mocked<GroupRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    groupRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithMembers: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addUser: jest.fn(),
      removeUser: jest.fn(),
      isUserInGroup: jest.fn(),
      findMembers: jest.fn(),
    };

    exception = {
      badRequestException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      unauthorizedException: jest.fn(),
      forbiddenException: jest.fn(),
      notFoundException: jest.fn(),
      conflictException: jest.fn(),
      internalServerErrorException: jest.fn(),
    };

    useCase = new CreateGroupUseCase(groupRepository, exception);
  });

  it('should create group when name is unique', async () => {
    groupRepository.findByName.mockResolvedValue(null);
    groupRepository.create.mockResolvedValue({
      id: 'grp-1', name: 'Marketing', memberCount: 0, createdAt: new Date(),
    });

    const result = await useCase.run('Marketing');

    expect(result.name).toBe('Marketing');
    expect(groupRepository.create).toHaveBeenCalledWith('Marketing');
  });

  it('should throw GRP002 when name already exists', async () => {
    groupRepository.findByName.mockResolvedValue({
      id: 'grp-existing', name: 'Marketing', memberCount: 2, createdAt: new Date(),
    });

    await expect(useCase.run('Marketing')).rejects.toThrow('A group with this name already exists.');
    expect(groupRepository.create).not.toHaveBeenCalled();
  });
});
