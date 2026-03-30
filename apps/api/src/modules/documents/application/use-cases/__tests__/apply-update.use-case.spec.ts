import { ApplyUpdateUseCase } from '../apply-update.use-case';
import { DocumentUpdateRepositoryInterface } from '../../../domain';

describe('ApplyUpdateUseCase', () => {
  let useCase: ApplyUpdateUseCase;
  let mockUpdateRepository: jest.Mocked<
    Pick<DocumentUpdateRepositoryInterface, 'saveUpdate'>
  >;

  beforeEach(() => {
    mockUpdateRepository = {
      saveUpdate: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ApplyUpdateUseCase(mockUpdateRepository);
  });

  it('should persist update via repository', async () => {
    const update = new Uint8Array([1, 2, 3]);
    await useCase.run('doc-1', update, 'user-1');

    expect(mockUpdateRepository.saveUpdate).toHaveBeenCalledWith(
      'doc-1',
      update,
      'user-1',
    );
  });
});
