export interface Model {
  id: string;
  apiUrl: string;
  apiKey: string;
  modelName: string;
  isReferee?: boolean;
}

export interface Stance {
  modelId: string;
  modelName: string;
  stance: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface Message {
  id: string;
  modelId: string;
  modelName: string;
  stance: string;
  stanceType: 'positive' | 'negative' | 'neutral';
  content: string;
  round: number;
  timestamp: number;
}

export interface DiscussionConfig {
  topic: string;
  rounds: number;
}

export interface DiscussionState {
  status: 'idle' | 'generating_stances' | 'discussing' | 'summarizing' | 'completed' | 'error';
  topic: string;
  rounds: number;
  currentRound: number;
  stances: Stance[];
  messages: Message[];
  summary?: string;
  error?: string;
}

export type SSEEvent =
  | { type: 'status'; status: DiscussionState['status'] }
  | { type: 'stances'; stances: Stance[] }
  | { type: 'round_start'; data: { round: number } }
  | { type: 'message_start'; data: Omit<Message, 'content'> }
  | { type: 'message_chunk'; data: { messageId: string; chunk: string } }
  | { type: 'message_end'; data: { messageId: string } }
  | { type: 'summary'; summary: string }
  | { type: 'complete'; data: Record<string, never> }
  | { type: 'error'; error: string };
