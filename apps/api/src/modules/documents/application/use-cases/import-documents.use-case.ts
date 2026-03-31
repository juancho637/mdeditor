import { ExceptionServiceInterface } from '@common/exception/domain';
import { PermissionLevel } from '@modules/permissions/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import {
  DocumentRepositoryInterface,
  DocumentSyncServiceInterface,
} from '../../domain';
import { CreateDocumentUseCase } from './create-document.use-case';

export interface ImportFileInput {
  originalname: string;
  buffer: Buffer;
}

export interface ImportDocumentResult {
  id: string;
  title: string;
  slug: string;
}

export class ImportDocumentsUseCase {
  private readonly context = ImportDocumentsUseCase.name;

  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly syncService: DocumentSyncServiceInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: {
    userId: string;
    folderId: string;
    files: ImportFileInput[];
  }): Promise<ImportDocumentResult[]> {
    const permission = await this.checkPermission.run(
      data.userId,
      data.folderId,
    );
    if (permission !== PermissionLevel.EDIT) {
      throw this.exception.forbiddenException({
        message: {
          codeError: 'DOC002',
          message: 'Insufficient permissions to import documents.',
          serverMessage: `User ${data.userId} lacks EDIT permission on folder ${data.folderId}`,
        },
        context: this.context,
      });
    }

    const existingDocs = await this.documentRepository.findByFolderId(
      data.folderId,
    );
    const usedTitles = new Set(existingDocs.map((d) => d.title));

    const results: ImportDocumentResult[] = [];

    for (const file of data.files) {
      try {
        const rawTitle = this.extractTitle(file.originalname);
        const title = this.resolveUniqueTitle(rawTitle, usedTitles);
        usedTitles.add(title);

        const content = file.buffer.toString('utf-8');

        const document = await this.createDocumentUseCase.run({
          title,
          folderId: data.folderId,
          createdBy: data.userId,
        });

        if (content) {
          await this.insertContent(document.id, content, data.userId);
        }

        results.push({
          id: document.id,
          title: document.title,
          slug: document.slug,
        });
      } catch {
        // best-effort: continue with next file on failure
      }
    }

    return results;
  }

  private extractTitle(filename: string): string {
    const base = filename.split('/').pop() ?? filename;
    return base.replace(/\.md$/i, '').trim() || 'Documento importado';
  }

  private resolveUniqueTitle(base: string, used: Set<string>): string {
    if (!used.has(base)) return base;
    let counter = 1;
    while (used.has(`${base} (${counter})`)) {
      counter++;
    }
    return `${base} (${counter})`;
  }

  private async insertContent(
    docId: string,
    content: string,
    userId: string,
  ): Promise<void> {
    const yDoc = await this.syncService.getOrLoadDocument(docId);
    try {
      let capturedUpdate: Uint8Array | null = null;
      const observer = (update: Uint8Array) => {
        capturedUpdate = update;
      };
      yDoc.on('update', observer);

      yDoc.transact(() => {
        const yText = yDoc.getText('content');
        yText.insert(0, content);
      });

      yDoc.off('update', observer);

      if (capturedUpdate) {
        await this.syncService.applyExternalUpdate(
          docId,
          capturedUpdate,
          userId,
        );
      }
    } finally {
      await this.syncService.releaseDocument(docId);
    }
  }
}
