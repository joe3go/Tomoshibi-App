
/**
 * @fileoverview Central type definitions for the Tomoshibi Japanese Learning App
 * 
 * This file serves as the main export barrel for all type definitions used throughout
 * the application. All types have been consolidated here to ensure consistency and
 * prevent duplication across the codebase.
 * 
 * @author Tomoshibi Development Team
 * @version 1.0.0
 */

// === CORE TYPE EXPORTS ===
export * from './auth';      // Authentication and user session types
export * from './chat';      // Chat conversations and messaging types  
export * from './personas';  // AI persona and tutor types
export * from './scenarios'; // Learning scenario and template types
export * from './vocabulary';// Vocabulary tracking and progress types
export * from './database';  // Database schema and table types
export * from './ui';        // UI component and interaction types

// === UTILITY FUNCTIONS ===

/**
 * Injects variables into a template string using double curly brace syntax
 * 
 * @param template - The template string with {{variable}} placeholders
 * @param variables - Object containing key-value pairs for variable substitution
 * @returns The template string with variables replaced
 * 
 * @example
 * ```typescript
 * const template = "Hello {{name}}, welcome to {{app}}!";
 * const result = injectPromptVariables(template, { 
 *   name: "Keiko", 
 *   app: "Tomoshibi" 
 * });
 * // Returns: "Hello Keiko, welcome to Tomoshibi!"
 * ```
 */
export function injectPromptVariables(
  template: string, 
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}
