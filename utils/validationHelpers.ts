/**
 * Form validation helpers
 * Centralizes validation rules for consistent error messages across forms
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate ritual name
 * Required, min 1 char, max 100 chars
 */
export function validateRitualName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Please enter a ritual name (e.g., "Full Moon Abundance Spell")';
  }
  if (name.trim().length > 100) {
    return `Ritual name is too long (${name.trim().length}/100 characters). Please shorten it.`;
  }
  return null;
}

/**
 * Validate intention/purpose text
 * Required, min 1 char, max 500 chars
 */
export function validateIntention(text: string): string | null {
  if (!text || text.trim().length === 0) {
    return 'Please describe your intention for this ritual (what you want to manifest)';
  }
  if (text.trim().length > 500) {
    return `Intention is too long (${text.trim().length}/500 characters). Please be more concise.`;
  }
  return null;
}

/**
 * Validate categories selection
 * Required: min 1, Max 3 categories
 */
export function validateCategories(categoryIds: string[]): string | null {
  if (!categoryIds || categoryIds.length === 0) {
    return 'Please select at least one category for your ritual';
  }
  if (categoryIds.length > 3) {
    return `Too many categories selected (${categoryIds.length}/3). Please choose up to 3.`;
  }
  return null;
}

/**
 * Validate moods selection for journal entry
 * Required: min 1 mood (no max)
 */
export function validateMoods(moods: string[]): string | null {
  if (!moods || moods.length === 0) {
    return 'Please select at least one mood that describes how you felt during this ritual';
  }
  return null;
}

/**
 * Validate scheduled date
 * Required if ritual is scheduled
 */
export function validateScheduledDate(date: string | undefined, schedule: string): string | null {
  if (schedule !== 'as_needed' && !date) {
    return `Please select a date for your ${schedule} ritual`;
  }
  return null;
}

/**
 * Validate tangible outcome
 * Optional, but max 200 chars if provided
 */
export function validateTangibleOutcome(outcome: string | undefined): string | null {
  if (outcome && outcome.trim().length > 200) {
    return 'Tangible outcome must be less than 200 characters';
  }
  return null;
}

/**
 * Validate journal entry reflection
 * Optional, but max 1000 chars if provided
 */
export function validateReflection(reflection: string | undefined): string | null {
  if (reflection && reflection.trim().length > 1000) {
    return 'Reflection must be less than 1000 characters';
  }
  return null;
}

/**
 * Validate category name for new category
 * Required, min 1 char, max 50 chars, alphanumeric + spaces/hyphens
 */
export function validateCategoryName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Category name is required';
  }
  if (name.trim().length > 50) {
    return 'Category name must be less than 50 characters';
  }
  if (!/^[a-zA-Z0-9\s\-]+$/.test(name)) {
    return 'Category name can only contain letters, numbers, spaces, and hyphens';
  }
  return null;
}

/**
 * Validate deity name for new deity
 * Required, min 1 char, max 50 chars
 */
export function validateDeityName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Deity name is required';
  }
  if (name.trim().length > 50) {
    return 'Deity name must be less than 50 characters';
  }
  return null;
}

/**
 * Validate ingredient list
 * Optional, but max 500 chars total if provided
 */
export function validateIngredients(ingredients: string | undefined): string | null {
  if (ingredients && ingredients.trim().length > 500) {
    return 'Ingredients list must be less than 500 characters';
  }
  return null;
}

/**
 * Validate description text
 * Optional, max 500 chars if provided
 */
export function validateDescription(desc: string | undefined): string | null {
  if (desc && desc.trim().length > 500) {
    return 'Description must be less than 500 characters';
  }
  return null;
}

/**
 * Validate email address
 * Optional, but if provided must be valid format
 */
export function validateEmail(email: string | undefined): string | null {
  if (!email) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validate entire ritual form
 * Returns all validation errors at once
 */
export function validateRitualForm(data: {
  name: string;
  intention: string;
  categories: string[];
  scheduledDate?: string;
  schedule: string;
  tangibleOutcome?: string;
  description?: string;
  ingredients?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const nameError = validateRitualName(data.name);
  if (nameError) errors.push({ field: 'name', message: nameError });

  const intentionError = validateIntention(data.intention);
  if (intentionError) errors.push({ field: 'intention', message: intentionError });

  const categoriesError = validateCategories(data.categories);
  if (categoriesError) errors.push({ field: 'categories', message: categoriesError });

  const dateError = validateScheduledDate(data.scheduledDate, data.schedule);
  if (dateError) errors.push({ field: 'scheduledDate', message: dateError });

  const outcomeError = validateTangibleOutcome(data.tangibleOutcome);
  if (outcomeError) errors.push({ field: 'tangibleOutcome', message: outcomeError });

  const descError = validateDescription(data.description);
  if (descError) errors.push({ field: 'description', message: descError });

  const ingError = validateIngredients(data.ingredients);
  if (ingError) errors.push({ field: 'ingredients', message: ingError });

  return errors;
}

/**
 * Validate entire journal entry form
 */
export function validateJournalForm(data: {
  reflection: string;
  moods: string[];
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const moodsError = validateMoods(data.moods);
  if (moodsError) errors.push({ field: 'moods', message: moodsError });

  const reflectionError = validateReflection(data.reflection);
  if (reflectionError) errors.push({ field: 'reflection', message: reflectionError });

  return errors;
}

/**
 * Check if there are any validation errors
 */
export function hasErrors(errors: ValidationError[]): boolean {
  return errors.length > 0;
}

/**
 * Get error message for a specific field
 */
export function getFieldError(errors: ValidationError[], field: string): string | null {
  const error = errors.find(e => e.field === field);
  return error ? error.message : null;
}
