import { SearchResultType } from '../../domain';

export class SearchResultPresenter {
  static toResponse(result: SearchResultType) {
    return {
      id: result.id,
      folder_id: result.folderId,
      folder_name: result.folderName,
      title: result.title,
      slug: result.slug,
      preview: result.preview,
    };
  }
}
