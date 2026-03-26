import { UpdateFolderUseCase } from '../update-folder.use-case';
import { FolderRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('UpdateFolderUseCase', () => {
  let useCase: UpdateFolderUseCase;
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
    useCase = new UpdateFolderUseCase(folderRepository, exception);
  });

  it('should rename folder', async () => {
    folderRepository.findById.mockResolvedValue({
      id: 'fld-1', parentId: null, name: 'Old', slug: 'old',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });
    folderRepository.findByNameInParent.mockResolvedValue(null);
    folderRepository.update.mockResolvedValue({
      id: 'fld-1', parentId: null, name: 'New', slug: 'new',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await useCase.run('fld-1', 'New');
    expect(result.name).toBe('New');
  });

  it('should throw FLD001 when folder not found', async () => {
    folderRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('nonexistent', 'Name')).rejects.toThrow('Folder not found.');
  });

  it('should throw FLD002 when new name conflicts', async () => {
    folderRepository.findById.mockResolvedValue({
      id: 'fld-1', parentId: null, name: 'Old', slug: 'old',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });
    folderRepository.findByNameInParent.mockResolvedValue({
      id: 'fld-2', parentId: null, name: 'Taken', slug: 'taken',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });

    await expect(useCase.run('fld-1', 'Taken')).rejects.toThrow('A folder with this name already exists in this location.');
  });
});
