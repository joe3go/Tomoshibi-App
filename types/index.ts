
// Main types export barrel
export * from './auth';
export * from './chat';
export * from './personas';
export * from './scenarios';
export * from './vocabulary';
export * from './database';
export * from './ui';

// Utility functions
export function injectPromptVariables(
  template: string, 
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}
