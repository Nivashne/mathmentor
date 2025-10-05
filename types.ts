import type React from 'react';

export type MessageRole = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: React.ReactNode;
}
