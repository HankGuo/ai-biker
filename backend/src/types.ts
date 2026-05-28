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

export interface AppConfig {
  default_topic: string;
  default_rounds: number;
}
