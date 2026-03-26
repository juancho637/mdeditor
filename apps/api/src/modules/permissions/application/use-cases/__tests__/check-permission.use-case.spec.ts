import { CheckPermissionUseCase } from '../check-permission.use-case';
import { PermissionRepositoryInterface, PermissionLevel } from '../../../domain';
import { GroupRepositoryInterface } from '@modules/groups/domain';
import { UserRepositoryInterface } from '@modules/users/domain';

describe('CheckPermissionUseCase', () => {
  let useCase: CheckPermissionUseCase;
  let permissionRepository: jest.Mocked<PermissionRepositoryInterface>;
  let groupRepository: jest.Mocked<GroupRepositoryInterface>;
  let userRepository: jest.Mocked<UserRepositoryInterface>;

  beforeEach(() => {
    permissionRepository = {
      findByFolderAndGroup: jest.fn(), findAll: jest.fn(), findByFolderId: jest.fn(),
      findById: jest.fn(), upsert: jest.fn(), delete: jest.fn(), deleteByFolderAndGroup: jest.fn(),
    };
    groupRepository = {
      create: jest.fn(), findById: jest.fn(), findByIdWithMembers: jest.fn(),
      findByName: jest.fn(), findAll: jest.fn(), update: jest.fn(), delete: jest.fn(),
      addUser: jest.fn(), removeUser: jest.fn(), isUserInGroup: jest.fn(),
      findMembers: jest.fn(), findGroupIdsByUserId: jest.fn(),
    };
    userRepository = {
      findByEmail: jest.fn(), findByEmailWithPassword: jest.fn(),
      findById: jest.fn(), create: jest.fn(), count: jest.fn(),
    };
    useCase = new CheckPermissionUseCase(permissionRepository, groupRepository, userRepository);
  });

  it('should return EDIT for admin user', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'admin-1', name: 'Admin', email: 'admin@test.com',
      isAdmin: true, createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await useCase.run('admin-1', 'fld-1');
    expect(result).toBe(PermissionLevel.EDIT);
  });

  it('should return VIEW when user has view permission', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'usr-1', name: 'User', email: 'user@test.com',
      isAdmin: false, createdAt: new Date(), updatedAt: new Date(),
    });
    groupRepository.findGroupIdsByUserId.mockResolvedValue(['grp-1']);
    permissionRepository.findByFolderId.mockResolvedValue([
      { id: 'perm-1', folderId: 'fld-1', groupId: 'grp-1', permissionLevel: PermissionLevel.VIEW, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await useCase.run('usr-1', 'fld-1');
    expect(result).toBe(PermissionLevel.VIEW);
  });

  it('should return EDIT when any group has edit permission (highest wins)', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'usr-1', name: 'User', email: 'user@test.com',
      isAdmin: false, createdAt: new Date(), updatedAt: new Date(),
    });
    groupRepository.findGroupIdsByUserId.mockResolvedValue(['grp-1', 'grp-2']);
    permissionRepository.findByFolderId.mockResolvedValue([
      { id: 'p1', folderId: 'fld-1', groupId: 'grp-1', permissionLevel: PermissionLevel.VIEW, createdAt: new Date(), updatedAt: new Date() },
      { id: 'p2', folderId: 'fld-1', groupId: 'grp-2', permissionLevel: PermissionLevel.EDIT, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await useCase.run('usr-1', 'fld-1');
    expect(result).toBe(PermissionLevel.EDIT);
  });

  it('should return null when user has no groups', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'usr-1', name: 'User', email: 'user@test.com',
      isAdmin: false, createdAt: new Date(), updatedAt: new Date(),
    });
    groupRepository.findGroupIdsByUserId.mockResolvedValue([]);

    const result = await useCase.run('usr-1', 'fld-1');
    expect(result).toBeNull();
  });

  it('should return null when user groups have no permission on folder', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'usr-1', name: 'User', email: 'user@test.com',
      isAdmin: false, createdAt: new Date(), updatedAt: new Date(),
    });
    groupRepository.findGroupIdsByUserId.mockResolvedValue(['grp-1']);
    permissionRepository.findByFolderId.mockResolvedValue([
      { id: 'p1', folderId: 'fld-1', groupId: 'grp-other', permissionLevel: PermissionLevel.EDIT, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await useCase.run('usr-1', 'fld-1');
    expect(result).toBeNull();
  });
});
