import { Controller, Get, Inject, Query } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { DocumentProvidersEnum } from '../../domain';
import { SearchDocumentsUseCase } from '../../application';
import { SearchDocumentsDto } from '../dto/search-documents.dto';
import { SearchResultPresenter } from '../presenters/search-result.presenter';

@Controller()
export class SearchDocumentsController {
  constructor(
    @Inject(DocumentProvidersEnum.SEARCH_DOCUMENTS_USE_CASE)
    private readonly searchDocumentsUseCase: SearchDocumentsUseCase,
  ) {}

  @Get('api/documents/search')
  @Auth()
  async run(
    @Query() dto: SearchDocumentsDto,
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    const results = await this.searchDocumentsUseCase.run(authUser.id, dto.q);
    return results.map(SearchResultPresenter.toResponse);
  }
}
