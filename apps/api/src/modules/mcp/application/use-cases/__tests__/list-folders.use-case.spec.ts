import { ListFoldersUseCase } from '../list-folders.use-case';
import { FolderRepositoryInterface } from '@modules/folders/domain/interfaces/folder-repository.interface';
import { CheckPermissionUseCase } from '@modules/permissions/application/use-cases/check-permission.use-case';
import { PermissionLevel } from '@modules/permissions/domain/enums/permission-level.enum';

describe('ListFoldersUseCase', () => {
  let useCase: ListFoldersUseCase;
  let folderRepository: jest.Mocked<FolderRepositoryInterface>;
  let checkPermission: jest.Mocked<CheckPermissionUseCase>;

  const mockFolders = [
    { id: 'folder-1', name: 'Accessible', slug: 'accessible', parentId: null, createdBy: 'admin', createdAt: new Date(), updatedAt: new Date() },
    { id: 'folder-2', name: 'Restricted', slug: 'restricted', parentId: null, createdBy: 'admin', createdAt: new Date(), updatedAt: new Date() },
    { id: 'folder-3', name: 'Also Accessible', slug: 'also-accessible', parentId: 'folder-1', createdBy: 'admin', createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(() => {
    folderRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByNameInParent: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getPath: jest.fn(),
    };

    checkPermission = {
      run: jest.fn(),
    } as any;

    useCase = new ListFoldersUseCase(folderRepository, checkPermission);
  });

  it('should return only folders with permission', async () => {
    folderRepository.findAll.mockResolvedValue(mockFolders);
    checkPermission.run
      .mockResolvedValueOnce(PermissionLevel.VIEW)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(PermissionLevel.EDIT);

    const result = await useCase.run('user-id');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'folder-1', name: 'Accessible', slug: 'accessible', parentId: null });
    expect(result[1]).toEqual({ id: 'folder-3', name: 'Also Accessible', slug: 'also-accessible', parentId: 'folder-1' });
  });

  it('should filter out folders without access', async () => {
    folderRepository.findAll.mockResolvedValue(mockFolders);
    checkPermission.run.mockResolvedValue(null);

    const result = await useCase.run('user-id');

    expect(result).toHaveLength(0);
  });

  it('should return all folders for admin user', async () => {
    folderRepository.findAll.mockResolvedValue(mockFolders);
    checkPermission.run.mockResolvedValue(PermissionLevel.EDIT);

    const result = await useCase.run('admin-id');

    expect(result).toHaveLength(3);
  });
});
