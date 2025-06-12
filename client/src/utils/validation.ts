import type { FormErrors, ValidationResult } from '@/types';

/**
 * Email validation utility
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password strength validation
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generic form validation utility
 */
export const validateForm = <T extends Record<string, unknown>>(
  data: T,
  rules: Partial<Record<keyof T, (value: T[keyof T]) => string | undefined>>
): ValidationResult => {
  const errors: FormErrors = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    if (validator && typeof validator === 'function') {
      const error = validator(data[field as keyof T]);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};

/**
 * Required field validator
 */
export const required = (value: unknown): string | undefined => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return 'This field is required';
  }
  return undefined;
};

/**
 * Email field validator
 */
export const emailValidator = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return 'Invalid email format';
  if (!value.trim()) return 'Email is required';
  if (!isValidEmail(value)) return 'Please enter a valid email address';
  return undefined;
};