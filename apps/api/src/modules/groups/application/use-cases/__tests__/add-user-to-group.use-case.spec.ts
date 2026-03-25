import { AddUserToGroupUseCase } from '../add-user-to-group.use-case';
import { GroupRepositoryInterface } from '../../../domain';
import { UserRepositoryInterface } from '@modules/users/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('AddUserToGroupUseCase', () => {
  let useCase: AddUserToGroupUseCase;
  let groupRepository: jest.Mocked<GroupRepositoryInterface>;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    groupRepository = {
      create: jest.fn(), findById: jest.fn(), findByIdWithMembers: jest.fn(),
      findByName: jest.fn(), findAll: jest.fn(), update: jest.fn(), delete: jest.fn(),
      addUser: jest.fn(), removeUser: jest.fn(), isUserInGroup: jest.fn(), findMembers: jest.fn(),
    };
    userRepository = {
      findByEmail: jest.fn(), findByEmailWithPassword: jest.fn(),
      findById: jest.fn(), create: jest.fn(), count: jest.fn(),
    };
    exception = {
      badRequestException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      unauthorizedException: jest.fn(), forbiddenException: jest.fn(),
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(), internalServerErrorException: jest.fn(),
    };
    useCase = new AddUserToGroupUseCase(groupRepository, userRepository, exception);
  });

  it('should add user to group', async () => {
    groupRepository.findById.mockResolvedValue({ id: 'grp-1', name: 'Dev', memberCount: 0, createdAt: new Date() });
    userRepository.findById.mockResolvedValue({ id: 'usr-1', name: 'User', email: 'u@t.com', isAdmin: false, createdAt: new Date(), updatedAt: new Date() });
    groupRepository.isUserInGroup.mockResolvedValue(false);

    await useCase.run('grp-1', 'usr-1');
    expect(groupRepository.addUser).toHaveBeenCalledWith('grp-1', 'usr-1');
  });

  it('should throw GRP003 when user already in group', async () => {
    groupRepository.findById.mockResolvedValue({ id: 'grp-1', name: 'Dev', memberCount: 1, createdAt: new Date() });
    userRepository.findById.mockResolvedValue({ id: 'usr-1', name: 'User', email: 'u@t.com', isAdmin: false, createdAt: new Date(), updatedAt: new Date() });
    groupRepository.isUserInGroup.mockResolvedValue(true);

    await expect(useCase.run('grp-1', 'usr-1')).rejects.toThrow('User is already a member of this group.');
  });

  it('should throw GRP001 when group not found', async () => {
    groupRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('nonexistent', 'usr-1')).rejects.toThrow('Group not found.');
  });

  it('should throw GRP005 when user not found', async () => {
    groupRepository.findById.mockResolvedValue({ id: 'grp-1', name: 'Dev', memberCount: 0, createdAt: new Date() });
    userRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('grp-1', 'nonexistent')).rejects.toThrow('User not found.');
  });
});
