import { google } from '@ai-sdk/google';

export type LLMTask = 'news' | 'ranking' | 'batch' | 'goodnight' | 'weekly';

export function getModel(task: LLMTask) {
  switch (task) {
    case 'news':
    case 'ranking':
      return google('gemini-2.5-flash');
    case 'batch':
    case 'goodnight':
      return google('gemini-2.5-flash-lite');
    case 'weekly':
      return google('gemini-2.5-pro');
  }
}
