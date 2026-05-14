import { BadRequestException, type ValidationError } from '@nestjs/common';

/**
 * Frontend-compatible validation issue payload keyed by DTO field name.
 */
export interface ValidationIssues {
  /** Field-specific validation messages displayed by forms and modals. */
  fieldErrors: Record<string, string[]>;
}

/**
 * Converts class-validator failures into the REST error shape expected by the
 * frontend error normalizer.
 *
 * @param errors - Raw class-validator error tree.
 * @returns Bad request exception containing message and field errors.
 */
export function createValidationException(errors: ValidationError[]): BadRequestException {
  const fieldErrors = flattenValidationErrors(errors);

  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    issues: { fieldErrors },
    message: 'Validation failed.',
  });
}

/**
 * Flattens nested validation errors into dot-separated field paths.
 *
 * @param errors - Raw validation errors.
 * @param parentPath - Prefix used for nested DTO fields.
 * @returns Map of field names to validation messages.
 */
function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string[]> {
  return errors.reduce<Record<string, string[]>>((fieldErrors, error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const messages = Object.values(error.constraints ?? {});

    if (messages.length > 0) {
      fieldErrors[path] = messages;
    }

    if (error.children && error.children.length > 0) {
      Object.assign(fieldErrors, flattenValidationErrors(error.children, path));
    }

    return fieldErrors;
  }, {});
}
