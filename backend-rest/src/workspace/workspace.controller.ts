import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { RequestUser } from '../common/types/authenticated-request.js';
import {
  CreateDocumentDto,
  CreateFolderDto,
  ListWorkspaceItemsQueryDto,
  MoveTargetsQueryDto,
  MoveWorkspaceItemDto,
  RenameWorkspaceItemDto,
  ShareWorkspaceItemDto,
  UpdateCollaboratorDto,
} from './dto/workspace.dto.js';
import { WorkspaceService } from './workspace.service.js';
import type {
  CollaboratorResponse,
  MoveTargetResponse,
  WorkspaceItemResponse,
  WorkspaceItemsResponse,
} from './workspace.types.js';

/**
 * REST controller for workspace explorer, folder, document, move, and sharing
 * endpoints consumed by the current frontend.
 */
@Controller('workspace')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  /**
   * Creates a workspace controller.
   *
   * @param workspaceService - Workspace application service.
   */
  constructor(@Inject(WorkspaceService) private readonly workspaceService: WorkspaceService) {}

  /**
   * Lists root items or the contents of a folder.
   *
   * @param currentUser - Authenticated user.
   * @param query - Optional folder query.
   * @returns Listing nested under `workspace` for REST client compatibility.
   */
  @Get('items')
  async listItems(
    @CurrentUser() currentUser: RequestUser,
    @Query() query: ListWorkspaceItemsQueryDto,
  ): Promise<{ workspace: WorkspaceItemsResponse }> {
    const workspace = await this.workspaceService.listItems(currentUser.id, query.parentId ?? null);
    return { workspace };
  }

  /**
   * Returns one accessible workspace item.
   *
   * @param currentUser - Authenticated user.
   * @param itemId - Item identifier.
   * @returns Item response.
   */
  @Get('items/:itemId')
  async getItem(
    @CurrentUser() currentUser: RequestUser,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ): Promise<{ item: WorkspaceItemResponse }> {
    const item = await this.workspaceService.getItem(currentUser.id, itemId);
    return { item };
  }

  /**
   * Creates a folder.
   *
   * @param currentUser - Authenticated user.
   * @param input - Folder creation body.
   * @returns Created item response.
   */
  @Post('folders')
  async createFolder(
    @CurrentUser() currentUser: RequestUser,
    @Body() input: CreateFolderDto,
  ): Promise<{ item: WorkspaceItemResponse }> {
    const item = await this.workspaceService.createFolder(currentUser.id, input);
    return { item };
  }

  /**
   * Creates a document shell.
   *
   * @param currentUser - Authenticated user.
   * @param input - Document creation body.
   * @returns Created item response.
   */
  @Post('documents')
  async createDocument(
    @CurrentUser() currentUser: RequestUser,
    @Body() input: CreateDocumentDto,
  ): Promise<{ item: WorkspaceItemResponse }> {
    const item = await this.workspaceService.createDocument(currentUser.id, input);
    return { item };
  }

  /**
   * Renames a folder or document.
   *
   * @param currentUser - Authenticated user.
   * @param itemId - Item identifier.
   * @param input - Rename body.
   * @returns Updated item response.
   */
  @Patch('items/:itemId/rename')
  async renameItem(
    @CurrentUser() currentUser: RequestUser,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: RenameWorkspaceItemDto,
  ): Promise<{ item: WorkspaceItemResponse }> {
    const item = await this.workspaceService.renameItem(currentUser.id, itemId, input.name);
    return { item };
  }

  /**
   * Deletes an item and descendants.
   *
   * @param currentUser - Authenticated user.
   * @param itemId - Item identifier.
   */
  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @CurrentUser() currentUser: RequestUser,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ): Promise<void> {
    await this.workspaceService.deleteItem(currentUser.id, itemId);
  }

  /**
   * Lists move destinations.
   *
   * @param currentUser - Authenticated user.
   * @param query - Move target query.
   * @returns Move target list.
   */
  @Get('move-targets')
  async listMoveTargets(
    @CurrentUser() currentUser: RequestUser,
    @Query() query: MoveTargetsQueryDto,
  ): Promise<{ targets: MoveTargetResponse[] }> {
    const targets = await this.workspaceService.listMoveTargets(
      currentUser.id,
      query.excludeItemId,
    );
    return { targets };
  }

  /**
   * Moves a folder or document.
   *
   * @param currentUser - Authenticated user.
   * @param itemId - Item identifier.
   * @param input - Move body.
   * @returns Updated item response.
   */
  @Patch('items/:itemId/move')
  async moveItem(
    @CurrentUser() currentUser: RequestUser,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: MoveWorkspaceItemDto,
  ): Promise<{ item: WorkspaceItemResponse }> {
    const item = await this.workspaceService.moveItem(
      currentUser.id,
      itemId,
      input.targetFolderId,
    );
    return { item };
  }

  /**
   * Shares an item with an existing user by email.
   *
   * @param currentUser - Authenticated user.
   * @param itemId - Item identifier.
   * @param input - Share body.
   * @returns Updated item response.
   */
  @Post('items/:itemId/share')
  async shareItem(
    @CurrentUser() currentUser: RequestUser,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: ShareWorkspaceItemDto,
  ): Promise<{ item: WorkspaceItemResponse }> {
    const item = await this.workspaceService.shareItem(currentUser.id, itemId, input);
    return { item };
  }

  /**
   * Lists direct collaborators on an item.
   *
   * @param currentUser - Authenticated user.
   * @param itemId - Item identifier.
   * @returns Direct collaborator list.
   */
  @Get('items/:itemId/collaborators')
  async listCollaborators(
    @CurrentUser() currentUser: RequestUser,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ): Promise<{ collaborators: CollaboratorResponse[] }> {
    const collaborators = await this.workspaceService.listCollaborators(currentUser.id, itemId);
    return { collaborators };
  }

  /**
   * Updates collaborator permission.
   *
   * @param currentUser - Authenticated user.
   * @param itemId - Item identifier.
   * @param collaboratorId - Collaborator user identifier.
   * @param input - Permission body.
   * @returns Updated item response.
   */
  @Patch('items/:itemId/collaborators/:collaboratorId')
  async updateCollaborator(
    @CurrentUser() currentUser: RequestUser,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Param('collaboratorId', new ParseUUIDPipe({ version: '4' })) collaboratorId: string,
    @Body() input: UpdateCollaboratorDto,
  ): Promise<{ item: WorkspaceItemResponse }> {
    const item = await this.workspaceService.updateCollaborator(
      currentUser.id,
      itemId,
      collaboratorId,
      input.permission,
    );
    return { item };
  }

  /**
   * Removes collaborator access.
   *
   * @param currentUser - Authenticated user.
   * @param itemId - Item identifier.
   * @param collaboratorId - Collaborator user identifier.
   * @returns Updated item response.
   */
  @Delete('items/:itemId/collaborators/:collaboratorId')
  async removeCollaborator(
    @CurrentUser() currentUser: RequestUser,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Param('collaboratorId', new ParseUUIDPipe({ version: '4' })) collaboratorId: string,
  ): Promise<{ item: WorkspaceItemResponse }> {
    const item = await this.workspaceService.removeCollaborator(
      currentUser.id,
      itemId,
      collaboratorId,
    );
    return { item };
  }
}
