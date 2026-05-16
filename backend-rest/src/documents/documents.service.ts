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

/** Options for loading document content. */
interface GetDocumentContentOptions {
  /** Whether this read should update last-opened metadata. */
  touchLastOpenedAt: boolean;
}

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
   * @param options - Metadata side effects allowed for this read.
   * @returns Document content response.
   */
  async getContent(
    userId: string,
    documentId: string,
    options: GetDocumentContentOptions = { touchLastOpenedAt: true },
  ): Promise<DocumentContentResponse> {
    const item = await this.workspaceService.getAccessibleRecord(userId, documentId);
    this.workspaceService.assertDocument(item);

    const access = await this.workspaceService.resolveAccess(userId, item);
    const content = await this.getOrCreateContent(item.id, options);
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

  /**
   * Loads a content row and optionally updates last-opened metadata.
   *
   * Polling passes `touchLastOpenedAt: false` so each sync check is read-only
   * unless the document content row must be created for the first time.
   *
   * @param itemId - Workspace document item identifier.
   * @param options - Read side-effect options.
   * @returns Existing or newly created content row.
   */
  private async getOrCreateContent(itemId: string, options: GetDocumentContentOptions) {
    const existing = await this.prisma.documentContent.findUnique({
      where: {
        itemId,
      },
    });

    if (existing && !options.touchLastOpenedAt) {
      return existing;
    }

    if (existing) {
      return this.prisma.documentContent.update({
        data: {
          lastOpenedAt: new Date(),
        },
        where: {
          itemId,
        },
      });
    }

    return this.prisma.documentContent.create({
      data: {
        content: defaultDocumentContent,
        itemId,
        ...(options.touchLastOpenedAt ? { lastOpenedAt: new Date() } : {}),
      },
    });
  }
}
