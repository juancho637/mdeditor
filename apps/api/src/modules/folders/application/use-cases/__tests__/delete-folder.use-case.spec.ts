import { DeleteFolderUseCase } from '../delete-folder.use-case';
import { FolderRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('DeleteFolderUseCase', () => {
  let useCase: DeleteFolderUseCase;
  let folderRepository: jest.Mocked<FolderRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    folderRepository = {
      create: jest.fn(), findById: jest.fn(), findByNameInParent: jest.fn(),
      findAll: jest.fn(), update: jest.fn(), delete: jest.fn(), getPath: jest.fn(),
    };
    exception = {
      badRequestException: jest.fn(), unauthorizedException: jest.fn(), forbiddenException: jest.fn(),
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(), internalServerErrorException: jest.fn(),
    };
    useCase = new DeleteFolderUseCase(folderRepository, exception);
  });

  it('should delete folder when it exists', async () => {
    folderRepository.findById.mockResolvedValue({
      id: 'fld-1', parentId: null, name: 'ToDelete', slug: 'to-delete',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });

    await useCase.run('fld-1');
    expect(folderRepository.delete).toHaveBeenCalledWith('fld-1');
  });

  it('should throw FLD001 when folder not found', async () => {
    folderRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('nonexistent')).rejects.toThrow('Folder not found.');
    expect(folderRepository.delete).not.toHaveBeenCalled();
  });
});
