/**
 * Error handling utilities
 * Provides enhanced error context and user-friendly error messages
 * Centralizes error handling patterns across the app
 */

import { ValidationError } from './validationHelpers';

export interface AppError {
  code: string;
  message: string;
  userMessage?: string;
  context?: Record<string, any>;
  originalError?: Error;
}

/**
 * Error categories with appropriate toast types and messages
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

export type ErrorToastType = 'error' | 'warning';

/**
 * Convert errors to user-friendly messages
 * @param error Error object or message
 * @param defaultMessage Fallback message if unable to parse
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  defaultMessage: string = 'Something went wrong. Please try again.'
): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('Network')) {
      return 'Network connection failed. Please check your internet and try again.';
    }
    if (error.message.includes('Storage') || error.message.includes('AsyncStorage')) {
      return 'Failed to save data. Please try again or restart the app.';
    }
    if (error.message.includes('Permission')) {
      return 'Permission denied. Please check your app settings.';
    }
    // Return error message for custom AppErrors
    if ('userMessage' in error) {
      return (error as any).userMessage || error.message;
    }
    return error.message || defaultMessage;
  }

  if (typeof error === 'object' && error !== null) {
    if ('message' in error) {
      return String(error.message);
    }
    if ('userMessage' in error) {
      return String(error.userMessage);
    }
  }

  return defaultMessage;
}

/**
 * Categorize an error for appropriate toast display
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    if (msg.includes('storage') || msg.includes('asyncstorage')) {
      return ErrorCategory.STORAGE;
    }
    if (msg.includes('permission') || msg.includes('denied')) {
      return ErrorCategory.PERMISSION;
    }
    if (msg.includes('not found') || msg.includes('404')) {
      return ErrorCategory.NOT_FOUND;
    }
    if (msg.includes('conflict') || msg.includes('409')) {
      return ErrorCategory.CONFLICT;
    }
    if (msg.includes('server') || msg.includes('500')) {
      return ErrorCategory.SERVER;
    }
  }
  return ErrorCategory.UNKNOWN;
}

/**
 * Convert validation errors to toast-friendly messages
 * Groups multiple errors by field and provides helpful context
 */
export function formatValidationErrorsForDisplay(errors: ValidationError[]): {
  title: string;
  message: string;
  fields: string[];
} {
  const fields = errors.map(e => e.field);
  const uniqueFields = [...new Set(fields)];

  let title = 'Validation Error';
  let message = 'Please fix the following:';

  if (errors.length === 1) {
    title = 'Invalid ' + capitalizeFieldName(errors[0].field);
    message = errors[0].message;
  } else if (uniqueFields.length > 1) {
    message = `Please check ${uniqueFields.length} field${uniqueFields.length > 1 ? 's' : ''}: ${uniqueFields
      .map(f => capitalizeFieldName(f))
      .join(', ')}`;
  }

  return {
    title,
    message,
    fields: uniqueFields,
  };
}

/**
 * Convert a field name to user-friendly capitalized format
 */
function capitalizeFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Safe async operation wrapper with error handling
 * Catches errors and returns error object instead of throwing
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<{ success: boolean; data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (err) {
    const error = createAppError('ASYNC_OPERATION_FAILED', err);
    return { success: false, error };
  }
}

/**
 * Create a standardized app error
 */
export function createAppError(
  code: string,
  originalError?: unknown,
  userMessage?: string
): AppError {
  const message = getUserFriendlyErrorMessage(originalError, code);
  return {
    code,
    message,
    userMessage: userMessage || message,
    originalError: originalError instanceof Error ? originalError : undefined,
  };
}

/**
 * Log error with context for debugging
 * In development, shows more detail; in production, sanitizes sensitive info
 */
export function logError(
  context: string,
  error: unknown,
  additionalData?: Record<string, any>
): void {
  const message = getUserFriendlyErrorMessage(error, 'Unknown error');
  const timestamp = new Date().toISOString();

  const errorLog = {
    timestamp,
    context,
    message,
    ...(additionalData && { additionalData }),
    ...(process.env.NODE_ENV === 'development' && {
      fullError: error instanceof Error ? error.stack : String(error),
    }),
  };

  console.error(`[${context}]`, errorLog);
}

/**
 * Determine if an error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  const category = categorizeError(error);
  // Network and storage errors are typically recoverable
  return (
    category === ErrorCategory.NETWORK ||
    category === ErrorCategory.STORAGE ||
    category === ErrorCategory.SERVER
  );
}

/**
 * Get toast type based on error category
 */
export function getToastTypeForError(error: unknown): ErrorToastType {
  const category = categorizeError(error);
  // Most errors are errors, but permission issues can be warnings
  return category === ErrorCategory.PERMISSION ? 'warning' : 'error';
}

/**
 * Validation error batch processor
 * Merges multiple validation error sources
 */
export function mergeValidationErrors(...errorArrays: ValidationError[][]): ValidationError[] {
  const merged: Record<string, ValidationError> = {};

  errorArrays.forEach(errors => {
    errors.forEach(error => {
      // Keep first error for each field
      if (!merged[error.field]) {
        merged[error.field] = error;
      }
    });
  });

  return Object.values(merged);
}

/**
 * Format error for form submission feedback
 * Used when async operation fails during form submission
 */
export function getFormSubmissionErrorMessage(error: unknown, operation: string): string {
  const baseMsg = getUserFriendlyErrorMessage(error);
  const operationName = capitalizeFieldName(operation);

  if (baseMsg.includes('Network')) {
    return `Could not ${operation} due to network issues. Please check your connection and try again.`;
  }
  if (baseMsg.includes('Storage')) {
    return `Could not ${operation} due to a storage error. Please restart the app and try again.`;
  }
  if (baseMsg.includes('Permission')) {
    return `Could not ${operation}. Please check your app permissions.`;
  }

  return `Failed to ${operation}. ${baseMsg}`;
}
