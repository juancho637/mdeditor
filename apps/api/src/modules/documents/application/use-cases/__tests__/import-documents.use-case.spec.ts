import { ImportDocumentsUseCase } from '../import-documents.use-case';
import {
  DocumentRepositoryInterface,
  DocumentSyncServiceInterface,
} from '../../../domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { ExceptionServiceInterface } from '@common/exception/domain';
import { PermissionLevel } from '@modules/permissions/domain';
import { CreateDocumentUseCase } from '../create-document.use-case';

const makeDoc = (id: string, title: string) => ({
  id,
  folderId: 'folder-1',
  title,
  slug: title.toLowerCase().replace(/\s+/g, '-'),
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockRepo = {
  findByFolderId: jest.fn(),
} as unknown as jest.Mocked<DocumentRepositoryInterface>;

const mockCreateUseCase = {
  run: jest.fn(),
} as unknown as jest.Mocked<CreateDocumentUseCase>;

const mockSyncService = {
  getOrLoadDocument: jest.fn(),
  applyExternalUpdate: jest.fn(),
  releaseDocument: jest.fn(),
} as unknown as jest.Mocked<DocumentSyncServiceInterface>;

const mockCheckPermission = {
  run: jest.fn(),
} as unknown as jest.Mocked<CheckPermissionUseCase>;

const mockException = {
  forbiddenException: jest
    .fn()
    .mockImplementation((args) => new Error(args.message.message)),
} as unknown as jest.Mocked<ExceptionServiceInterface>;

const makeYDoc = () => {
  const listeners: Array<(update: Uint8Array) => void> = [];
  return {
    on: jest.fn((event, cb) => {
      if (event === 'update') listeners.push(cb);
    }),
    off: jest.fn(),
    transact: jest.fn((fn) => {
      fn();
      listeners.forEach((cb) => cb(new Uint8Array([1, 2, 3])));
    }),
    getText: jest.fn(() => ({ insert: jest.fn() })),
  };
};

describe('ImportDocumentsUseCase', () => {
  let useCase: ImportDocumentsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ImportDocumentsUseCase(
      mockRepo,
      mockCreateUseCase,
      mockSyncService,
      mockCheckPermission,
      mockException,
    );
  });

  it('imports a single file successfully', async () => {
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.EDIT);
    mockRepo.findByFolderId.mockResolvedValue([]);
    mockCreateUseCase.run.mockResolvedValue(makeDoc('doc-1', 'guide'));
    mockSyncService.getOrLoadDocument.mockResolvedValue(makeYDoc());

    const result = await useCase.run({
      userId: 'user-1',
      folderId: 'folder-1',
      files: [{ originalname: 'guide.md', buffer: Buffer.from('# Guide') }],
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('guide');
    expect(mockCreateUseCase.run).toHaveBeenCalledWith({
      title: 'guide',
      folderId: 'folder-1',
      createdBy: 'user-1',
    });
  });

  it('imports multiple files successfully', async () => {
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.EDIT);
    mockRepo.findByFolderId.mockResolvedValue([]);
    mockCreateUseCase.run
      .mockResolvedValueOnce(makeDoc('doc-1', 'file-a'))
      .mockResolvedValueOnce(makeDoc('doc-2', 'file-b'));
    mockSyncService.getOrLoadDocument.mockResolvedValue(makeYDoc());

    const result = await useCase.run({
      userId: 'user-1',
      folderId: 'folder-1',
      files: [
        { originalname: 'file-a.md', buffer: Buffer.from('Content A') },
        { originalname: 'file-b.md', buffer: Buffer.from('Content B') },
      ],
    });

    expect(result).toHaveLength(2);
    expect(mockCreateUseCase.run).toHaveBeenCalledTimes(2);
  });

  it('adds "(1)" suffix when title already exists in folder', async () => {
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.EDIT);
    mockRepo.findByFolderId.mockResolvedValue([makeDoc('existing', 'guide')]);
    mockCreateUseCase.run.mockResolvedValue(makeDoc('doc-new', 'guide (1)'));
    mockSyncService.getOrLoadDocument.mockResolvedValue(makeYDoc());

    await useCase.run({
      userId: 'user-1',
      folderId: 'folder-1',
      files: [{ originalname: 'guide.md', buffer: Buffer.from('# Guide') }],
    });

    expect(mockCreateUseCase.run).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'guide (1)' }),
    );
  });

  it('adds "(2)" suffix when both base title and "(1)" already exist', async () => {
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.EDIT);
    mockRepo.findByFolderId.mockResolvedValue([
      makeDoc('e1', 'guide'),
      makeDoc('e2', 'guide (1)'),
    ]);
    mockCreateUseCase.run.mockResolvedValue(makeDoc('doc-new', 'guide (2)'));
    mockSyncService.getOrLoadDocument.mockResolvedValue(makeYDoc());

    await useCase.run({
      userId: 'user-1',
      folderId: 'folder-1',
      files: [{ originalname: 'guide.md', buffer: Buffer.from('# Guide') }],
    });

    expect(mockCreateUseCase.run).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'guide (2)' }),
    );
  });

  it('throws forbidden exception when user lacks EDIT permission', async () => {
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.VIEW);

    await expect(
      useCase.run({
        userId: 'user-1',
        folderId: 'folder-1',
        files: [{ originalname: 'file.md', buffer: Buffer.from('content') }],
      }),
    ).rejects.toThrow();

    expect(mockCreateUseCase.run).not.toHaveBeenCalled();
  });
});
