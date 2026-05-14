import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Request body accepted by registration aliases.
 */
export class RegisterDto {
  /** User display name shown in navigation and ownership metadata. */
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  /** Unique user email address. */
  @IsEmail()
  @MaxLength(254)
  email!: string;

  /** Plain-text password that will be hashed before storage. */
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  password!: string;

  /** Optional frontend avatar color token. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  avatarColor?: string;
}

/**
 * Request body accepted by login aliases.
 */
export class LoginDto {
  /** User email address. */
  @IsEmail()
  @MaxLength(254)
  email!: string;

  /** Plain-text password to verify. */
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  password!: string;
}
