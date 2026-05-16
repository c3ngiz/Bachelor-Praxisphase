import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { RequestUser } from '../common/types/authenticated-request.js';
import { DocumentsService } from './documents.service.js';
import type { DocumentContentResponse } from './documents.types.js';
import { UpdateDocumentContentDto } from './dto/document-content.dto.js';

/**
 * REST endpoints for document editor content loading and saving.
 */
@Controller('workspace/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  /**
   * Creates a documents controller.
   *
   * @param documentsService - Document content service.
   */
  constructor(@Inject(DocumentsService) private readonly documentsService: DocumentsService) {}

  /**
   * Loads document content for read-only or editable editor sessions.
   *
   * @param currentUser - Authenticated user.
   * @param documentId - Workspace document identifier.
   * @param touch - Whether to update last-opened metadata for this read.
   * @returns Document content response.
   */
  @Get(':documentId/content')
  getContent(
    @CurrentUser() currentUser: RequestUser,
    @Param('documentId', new ParseUUIDPipe({ version: '4' })) documentId: string,
    @Query('touch') touch?: string,
  ): Promise<DocumentContentResponse> {
    return this.documentsService.getContent(currentUser.id, documentId, {
      touchLastOpenedAt: shouldTouchLastOpenedAt(touch),
    });
  }

  /**
   * Saves or autosaves document content.
   *
   * @param currentUser - Authenticated user.
   * @param documentId - Workspace document identifier.
   * @param input - Content save body.
   * @returns Updated document content response.
   */
  @Patch(':documentId/content')
  updateContent(
    @CurrentUser() currentUser: RequestUser,
    @Param('documentId', new ParseUUIDPipe({ version: '4' })) documentId: string,
    @Body() input: UpdateDocumentContentDto,
  ): Promise<DocumentContentResponse> {
    return this.documentsService.updateContent(currentUser.id, documentId, input);
  }
}

/**
 * Parses the optional GET query used by polling requests.
 *
 * @param value - Raw query value.
 * @returns False only for explicit false-like values.
 */
function shouldTouchLastOpenedAt(value: string | undefined): boolean {
  return value !== 'false' && value !== '0';
}
