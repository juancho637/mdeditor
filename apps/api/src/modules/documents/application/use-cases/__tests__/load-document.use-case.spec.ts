import * as Y from 'yjs';
import { LoadDocumentUseCase } from '../load-document.use-case';
import { DocumentRepositoryInterface } from '../../../domain';
import {
  DocumentSnapshotRepositoryInterface,
  DocumentUpdateRepositoryInterface,
} from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('LoadDocumentUseCase', () => {
  let useCase: LoadDocumentUseCase;
  let mockDocumentRepository: jest.Mocked<
    Pick<DocumentRepositoryInterface, 'findById'>
  >;
  let mockSnapshotRepository: jest.Mocked<DocumentSnapshotRepositoryInterface>;
  let mockUpdateRepository: jest.Mocked<
    Pick<DocumentUpdateRepositoryInterface, 'getUpdatesSince'>
  >;
  let mockException: jest.Mocked<
    Pick<ExceptionServiceInterface, 'notFoundException'>
  >;

  beforeEach(() => {
    mockDocumentRepository = {
      findById: jest.fn(),
    };
    mockSnapshotRepository = {
      getLatestSnapshot: jest.fn(),
      saveSnapshot: jest.fn(),
    };
    mockUpdateRepository = {
      getUpdatesSince: jest.fn(),
    };
    mockException = {
      notFoundException: jest.fn((data) => new Error(data.message.message)),
    };

    useCase = new LoadDocumentUseCase(
      mockDocumentRepository,
      mockSnapshotRepository,
      mockUpdateRepository,
      mockException,
    );
  });

  it('should throw when document not found', async () => {
    mockDocumentRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('doc-1')).rejects.toThrow();
    expect(mockException.notFoundException).toHaveBeenCalled();
  });

  it('should load from yjsState when available', async () => {
    const sourceDoc = new Y.Doc();
    sourceDoc.getText('content').insert(0, 'hello');
    const yjsState = Buffer.from(Y.encodeStateAsUpdate(sourceDoc));

    mockDocumentRepository.findById.mockResolvedValue({
      id: 'doc-1',
      yjsState,
      contentMarkdown: 'hello',
    });

    const result = await useCase.run('doc-1');
    expect(result).toBeInstanceOf(Y.Doc);
    expect(result.getText('content').toString()).toBe('hello');
    result.destroy();
    sourceDoc.destroy();
  });

  it('should initialize from contentMarkdown when no yjsState or snapshot', async () => {
    mockDocumentRepository.findById.mockResolvedValue({
      id: 'doc-1',
      yjsState: null,
      contentMarkdown: '# Hello World',
    });
    mockSnapshotRepository.getLatestSnapshot.mockResolvedValue(null);

    const result = await useCase.run('doc-1');
    expect(result.getText('content').toString()).toBe('# Hello World');
    result.destroy();
  });

  it('should load from snapshot and apply subsequent updates', async () => {
    const snapshotDoc = new Y.Doc();
    snapshotDoc.getText('content').insert(0, 'base');
    const snapshotData = Y.encodeStateAsUpdate(snapshotDoc);

    const updateDoc = new Y.Doc();
    Y.applyUpdate(updateDoc, snapshotData);
    updateDoc.getText('content').insert(4, ' updated');
    const updateData = Y.encodeStateAsUpdate(updateDoc);

    const snapshotDate = new Date('2026-01-01');

    mockDocumentRepository.findById.mockResolvedValue({
      id: 'doc-1',
      yjsState: null,
      contentMarkdown: 'base',
    });
    mockSnapshotRepository.getLatestSnapshot.mockResolvedValue({
      yjsSnapshot: snapshotData,
      createdAt: snapshotDate,
    });
    mockUpdateRepository.getUpdatesSince.mockResolvedValue([updateData]);

    const result = await useCase.run('doc-1');
    expect(result.getText('content').toString()).toBe('base updated');
    result.destroy();
    snapshotDoc.destroy();
    updateDoc.destroy();
  });

  it('should handle empty contentMarkdown', async () => {
    mockDocumentRepository.findById.mockResolvedValue({
      id: 'doc-1',
      yjsState: null,
      contentMarkdown: '',
    });
    mockSnapshotRepository.getLatestSnapshot.mockResolvedValue(null);

    const result = await useCase.run('doc-1');
    expect(result.getText('content').toString()).toBe('');
    result.destroy();
  });
});
