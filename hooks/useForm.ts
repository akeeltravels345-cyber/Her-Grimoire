/**
 * useForm Hook
 * Generic form state management with validation support
 * Used by: add-ritual, add-library-ritual, log-ritual, edit forms, etc.
 */

import { useState, useCallback } from 'react';
import { ValidationError } from '../utils/validationHelpers';

export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  touched: Record<keyof T, boolean>;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => ValidationError[];
}

export interface UseFormReturn<T> {
  // State
  values: T;
  errors: ValidationError[];
  touched: Record<keyof T, boolean>;
  isDirty: boolean;
  isSubmitting: boolean;

  // Handlers
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  setFieldError: (field: string, message: string) => void;
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: () => Promise<void>;
  reset: () => void;

  // Utilities
  getFieldError: (field: keyof T) => string | null;
  hasFieldError: (field: keyof T) => boolean;
  hasErrors: () => boolean;
  isFieldTouched: (field: keyof T) => boolean;
}

/**
 * Hook for managing form state with validation
 * @param options Form configuration
 * @returns Form state and handlers
 */
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialValues, onSubmit, validate } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>(
    Object.keys(initialValues).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {}
    ) as Record<keyof T, boolean>
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if form has been modified
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  // Update a single field value
  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setValues(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Mark field as touched
  const setFieldTouched = useCallback(
    (field: keyof T, isTouched: boolean) => {
      setTouched(prev => ({
        ...prev,
        [field]: isTouched,
      }));
    },
    []
  );

  // Set error for a field
  const setFieldError = useCallback(
    (field: string, message: string) => {
      setErrors(prev => {
        // Remove existing error for this field
        const filtered = prev.filter(e => e.field !== field);
        return [...filtered, { field, message }];
      });
    },
    []
  );

  // Handle field change
  const handleChange = useCallback(
    (field: keyof T) => (value: any) => {
      setFieldValue(field, value);
    },
    [setFieldValue]
  );

  // Handle field blur (mark as touched)
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setFieldTouched(field, true);
    },
    [setFieldTouched]
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validate if validator provided
    if (validate) {
      const newErrors = validate(values);
      setErrors(newErrors);

      // Don't submit if there are errors
      if (newErrors.length > 0) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors([]);
    setTouched(
      Object.keys(initialValues).reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {}
      ) as Record<keyof T, boolean>
    );
  }, [initialValues]);

  // Get error message for a field
  const getFieldError = useCallback(
    (field: keyof T): string | null => {
      const error = errors.find(e => e.field === String(field));
      return error ? error.message : null;
    },
    [errors]
  );

  // Check if field has error
  const hasFieldError = useCallback(
    (field: keyof T): boolean => {
      return errors.some(e => e.field === String(field));
    },
    [errors]
  );

  // Check if form has any errors
  const hasErrors = useCallback(() => {
    return errors.length > 0;
  }, [errors]);

  // Check if field has been touched
  const isFieldTouched = useCallback(
    (field: keyof T): boolean => {
      return touched[field] || false;
    },
    [touched]
  );

  return {
    values,
    errors,
    touched,
    isDirty,
    isSubmitting,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldError,
    hasFieldError,
    hasErrors,
    isFieldTouched,
  };
}
