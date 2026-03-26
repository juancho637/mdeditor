import { SetPermissionUseCase } from '../set-permission.use-case';
import { PermissionRepositoryInterface, PermissionLevel } from '../../../domain';
import { FolderRepositoryInterface } from '@modules/folders/domain';
import { GroupRepositoryInterface } from '@modules/groups/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('SetPermissionUseCase', () => {
  let useCase: SetPermissionUseCase;
  let permissionRepository: jest.Mocked<PermissionRepositoryInterface>;
  let folderRepository: jest.Mocked<FolderRepositoryInterface>;
  let groupRepository: jest.Mocked<GroupRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    permissionRepository = {
      findByFolderAndGroup: jest.fn(), findAll: jest.fn(), findByFolderId: jest.fn(),
      findById: jest.fn(), upsert: jest.fn(), delete: jest.fn(), deleteByFolderAndGroup: jest.fn(),
    };
    folderRepository = {
      create: jest.fn(), findById: jest.fn(), findByNameInParent: jest.fn(),
      findAll: jest.fn(), update: jest.fn(), delete: jest.fn(), getPath: jest.fn(),
    };
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
    useCase = new SetPermissionUseCase(permissionRepository, folderRepository, groupRepository, exception);
  });

  it('should create permission when it does not exist', async () => {
    folderRepository.findById.mockResolvedValue({
      id: 'fld-1', parentId: null, name: 'Root', slug: 'root',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });
    groupRepository.findById.mockResolvedValue({
      id: 'grp-1', name: 'Dev', memberCount: 2, createdAt: new Date(),
    });
    permissionRepository.upsert.mockResolvedValue({
      id: 'perm-1', folderId: 'fld-1', groupId: 'grp-1',
      permissionLevel: PermissionLevel.EDIT, createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await useCase.run({
      folderId: 'fld-1', groupId: 'grp-1', permissionLevel: PermissionLevel.EDIT,
    });

    expect(result?.permissionLevel).toBe(PermissionLevel.EDIT);
    expect(permissionRepository.upsert).toHaveBeenCalledWith('fld-1', 'grp-1', PermissionLevel.EDIT);
  });

  it('should update permission when it already exists', async () => {
    folderRepository.findById.mockResolvedValue({
      id: 'fld-1', parentId: null, name: 'Root', slug: 'root',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });
    groupRepository.findById.mockResolvedValue({
      id: 'grp-1', name: 'Dev', memberCount: 2, createdAt: new Date(),
    });
    permissionRepository.upsert.mockResolvedValue({
      id: 'perm-1', folderId: 'fld-1', groupId: 'grp-1',
      permissionLevel: PermissionLevel.VIEW, createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await useCase.run({
      folderId: 'fld-1', groupId: 'grp-1', permissionLevel: PermissionLevel.VIEW,
    });

    expect(result.permissionLevel).toBe(PermissionLevel.VIEW);
  });

  it('should throw FLD001 when folder not found', async () => {
    folderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.run({ folderId: 'nonexistent', groupId: 'grp-1', permissionLevel: PermissionLevel.VIEW }),
    ).rejects.toThrow('Folder not found.');
  });

  it('should throw GRP001 when group not found', async () => {
    folderRepository.findById.mockResolvedValue({
      id: 'fld-1', parentId: null, name: 'Root', slug: 'root',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });
    groupRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.run({ folderId: 'fld-1', groupId: 'nonexistent', permissionLevel: PermissionLevel.VIEW }),
    ).rejects.toThrow('Group not found.');
  });
});
