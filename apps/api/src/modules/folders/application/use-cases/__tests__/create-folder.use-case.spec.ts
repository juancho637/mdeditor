import { CreateFolderUseCase } from '../create-folder.use-case';
import { FolderRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('CreateFolderUseCase', () => {
  let useCase: CreateFolderUseCase;
  let folderRepository: jest.Mocked<FolderRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    folderRepository = {
      create: jest.fn(), findById: jest.fn(), findByNameInParent: jest.fn(),
      findAll: jest.fn(), update: jest.fn(), delete: jest.fn(), getPath: jest.fn(),
    };
    exception = {
      badRequestException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      unauthorizedException: jest.fn(), forbiddenException: jest.fn(),
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(), internalServerErrorException: jest.fn(),
    };
    useCase = new CreateFolderUseCase(folderRepository, exception);
  });

  it('should create root folder', async () => {
    folderRepository.findByNameInParent.mockResolvedValue(null);
    folderRepository.create.mockResolvedValue({
      id: 'fld-1', parentId: null, name: 'Marketing', slug: 'marketing',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await useCase.run({ name: 'Marketing', parentId: null, createdBy: 'usr-1' });

    expect(result.name).toBe('Marketing');
    expect(result.parentId).toBeNull();
    expect(folderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Marketing', slug: 'marketing', parentId: null }),
    );
  });

  it('should create subfolder when parent exists', async () => {
    folderRepository.findById.mockResolvedValue({
      id: 'parent-1', parentId: null, name: 'Root', slug: 'root',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });
    folderRepository.findByNameInParent.mockResolvedValue(null);
    folderRepository.create.mockResolvedValue({
      id: 'fld-2', parentId: 'parent-1', name: 'Sub', slug: 'sub',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await useCase.run({ name: 'Sub', parentId: 'parent-1', createdBy: 'usr-1' });

    expect(result.parentId).toBe('parent-1');
  });

  it('should throw FLD001 when parent does not exist', async () => {
    folderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.run({ name: 'Sub', parentId: 'nonexistent', createdBy: 'usr-1' }),
    ).rejects.toThrow('Folder not found.');
  });

  it('should throw FLD002 when duplicate name in same parent', async () => {
    folderRepository.findByNameInParent.mockResolvedValue({
      id: 'existing', parentId: null, name: 'Marketing', slug: 'marketing',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });

    await expect(
      useCase.run({ name: 'Marketing', parentId: null, createdBy: 'usr-1' }),
    ).rejects.toThrow('A folder with this name already exists in this location.');
  });
});
