import { IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * Request body accepted by document content save and autosave endpoints.
 */
export class UpdateDocumentContentDto {
  /** TipTap/ProseMirror JSON document content. */
  @IsObject()
  content!: Record<string, unknown>;

  /** Optional expected revision for optimistic save checks. */
  @IsOptional()
  @IsInt()
  @Min(1)
  revision?: number;

  /** Optional document title alias used by editor integrations. */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  /** Optional document name alias used by workspace integrations. */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;
}
