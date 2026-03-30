import * as Y from 'yjs';
import { PersistSnapshotUseCase } from '../persist-snapshot.use-case';
import { DocumentRepositoryInterface } from '@modules/documents/domain';
import {
  DocumentSnapshotRepositoryInterface,
  DocumentUpdateRepositoryInterface,
} from '../../../domain';

describe('PersistSnapshotUseCase', () => {
  let useCase: PersistSnapshotUseCase;
  let mockDocumentRepository: jest.Mocked<
    Pick<DocumentRepositoryInterface, 'update'>
  >;
  let mockSnapshotRepository: jest.Mocked<
    Pick<DocumentSnapshotRepositoryInterface, 'saveSnapshot'>
  >;
  let mockUpdateRepository: jest.Mocked<
    Pick<DocumentUpdateRepositoryInterface, 'deleteBeforeDate'>
  >;

  beforeEach(() => {
    mockDocumentRepository = {
      update: jest.fn().mockResolvedValue({}),
    };
    mockSnapshotRepository = {
      saveSnapshot: jest.fn().mockResolvedValue(undefined),
    };
    mockUpdateRepository = {
      deleteBeforeDate: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new PersistSnapshotUseCase(
      mockDocumentRepository,
      mockSnapshotRepository,
      mockUpdateRepository,
    );
  });

  it('should save snapshot, update document, and cleanup old updates', async () => {
    const yDoc = new Y.Doc();
    yDoc.getText('content').insert(0, '# Test Content');

    await useCase.run('doc-1', yDoc);

    expect(mockSnapshotRepository.saveSnapshot).toHaveBeenCalledWith(
      'doc-1',
      expect.any(Uint8Array),
      '# Test Content',
      undefined,
    );

    expect(mockDocumentRepository.update).toHaveBeenCalledWith('doc-1', {
      yjsState: expect.any(Buffer),
      contentMarkdown: '# Test Content',
    });

    expect(mockUpdateRepository.deleteBeforeDate).toHaveBeenCalledWith(
      'doc-1',
      expect.any(Date),
    );

    yDoc.destroy();
  });

  it('should handle empty document', async () => {
    const yDoc = new Y.Doc();

    await useCase.run('doc-1', yDoc);

    expect(mockSnapshotRepository.saveSnapshot).toHaveBeenCalledWith(
      'doc-1',
      expect.any(Uint8Array),
      '',
      undefined,
    );

    expect(mockUpdateRepository.deleteBeforeDate).toHaveBeenCalledWith(
      'doc-1',
      expect.any(Date),
    );

    yDoc.destroy();
  });
});
