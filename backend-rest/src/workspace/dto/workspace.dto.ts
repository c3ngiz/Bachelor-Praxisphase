import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator';

/**
 * Query string accepted by workspace item listing.
 */
export class ListWorkspaceItemsQueryDto {
  /** Parent folder identifier; omitted for the root workspace. */
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}

/**
 * Query string accepted by move target listing.
 */
export class MoveTargetsQueryDto {
  /** Item being moved and therefore excluded from destination choices. */
  @IsUUID('4')
  excludeItemId!: string;
}

/**
 * Request body used to create a folder.
 */
export class CreateFolderDto {
  /** New folder display name. */
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  /** Parent folder identifier, or null for root. */
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  @ValidateIf((_object, value: unknown) => value !== null && value !== undefined)
  @IsUUID('4')
  parentId!: string | null;
}

/**
 * Request body used to create a document shell.
 */
export class CreateDocumentDto {
  /** New document display name. */
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  /** Parent folder identifier, or null for root. */
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  @ValidateIf((_object, value: unknown) => value !== null && value !== undefined)
  @IsUUID('4')
  parentId!: string | null;
}

/**
 * Request body used to rename folders or documents.
 */
export class RenameWorkspaceItemDto {
  /** Replacement display name. */
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;
}

/**
 * Request body used to move folders or documents.
 */
export class MoveWorkspaceItemDto {
  /** Destination folder identifier, or null for root. */
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  @ValidateIf((_object, value: unknown) => value !== null && value !== undefined)
  @IsUUID('4')
  targetFolderId!: string | null;
}

/**
 * Request body used to invite a collaborator.
 */
export class ShareWorkspaceItemDto {
  /** Existing user email address to grant access to. */
  @IsEmail()
  @MaxLength(254)
  email!: string;

  /** Permission granted to the collaborator. */
  @IsIn(['read', 'write'])
  permission!: 'read' | 'write';
}

/**
 * Request body used to change collaborator access.
 */
export class UpdateCollaboratorDto {
  /** Replacement permission for the collaborator. */
  @IsIn(['read', 'write'])
  permission!: 'read' | 'write';
}
