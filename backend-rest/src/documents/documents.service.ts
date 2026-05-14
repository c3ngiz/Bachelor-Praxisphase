import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { WorkspaceService } from '../workspace/workspace.service.js';
import type { DocumentContentResponse } from './documents.types.js';
import type { UpdateDocumentContentDto } from './dto/document-content.dto.js';

const defaultDocumentContent = {
  content: [{ type: 'paragraph' }],
  type: 'doc',
};

/**
 * Handles document content loading and save/autosave persistence.
 */
@Injectable()
export class DocumentsService {
  /**
   * Creates a documents service.
   *
   * @param prisma - Shared Prisma client.
   * @param workspaceService - Workspace permission and metadata service.
   */
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService,
  ) {}

  /**
   * Loads a document's JSON content and marks it as opened.
   *
   * @param userId - Current user identifier.
   * @param documentId - Workspace document identifier.
   * @returns Document content response.
   */
  async getContent(userId: string, documentId: string): Promise<DocumentContentResponse> {
    const item = await this.workspaceService.getAccessibleRecord(userId, documentId);
    this.workspaceService.assertDocument(item);

    const access = await this.workspaceService.resolveAccess(userId, item);
    const content = await this.prisma.documentContent.upsert({
      create: {
        content: defaultDocumentContent,
        itemId: item.id,
        lastOpenedAt: new Date(),
      },
      update: {
        lastOpenedAt: new Date(),
      },
      where: {
        itemId: item.id,
      },
    });
    const document = await this.workspaceService.getItem(userId, item.id);

    return {
      canWrite: access?.permission === 'owner' || access?.permission === 'write',
      content: content.content,
      document,
      revision: content.revision,
      updatedAt: content.updatedAt.toISOString(),
    };
  }

  /**
   * Saves a document's JSON content and increments its revision.
   *
   * @param userId - Current user identifier.
   * @param documentId - Workspace document identifier.
   * @param input - Save body.
   * @returns Updated document content response.
   */
  async updateContent(
    userId: string,
    documentId: string,
    input: UpdateDocumentContentDto,
  ): Promise<DocumentContentResponse> {
    const item = await this.workspaceService.assertCanWriteItem(userId, documentId);
    this.workspaceService.assertDocument(item);

    const nextName = input.name ?? input.title;

    if (nextName && nextName.trim() && nextName.trim() !== item.name) {
      await this.workspaceService.renameItem(userId, item.id, nextName);
    }

    const existing = await this.prisma.documentContent.upsert({
      create: {
        content: defaultDocumentContent,
        itemId: item.id,
      },
      update: {},
      where: {
        itemId: item.id,
      },
    });

    if (input.revision && existing.revision !== input.revision) {
      throw new ConflictException({
        code: 'DOCUMENT_REVISION_CONFLICT',
        message: 'Document content has changed since it was loaded.',
      });
    }

    const content = await this.prisma.documentContent.update({
      data: {
        content: input.content as Prisma.InputJsonValue,
        revision: {
          increment: 1,
        },
      },
      where: {
        itemId: item.id,
      },
    });
    const document = await this.workspaceService.getItem(userId, item.id);

    return {
      canWrite: true,
      content: content.content,
      document,
      revision: content.revision,
      updatedAt: content.updatedAt.toISOString(),
    };
  }
}
