import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Model, Stance, Message, DiscussionState, SSEEvent } from '../types';

const MODEL_STORAGE_KEY = 'ai-bicker.models.v1';

type Action =
  | { type: 'SET_MODELS'; models: Model[] }
  | { type: 'SET_TOPIC'; topic: string }
  | { type: 'SET_ROUNDS'; rounds: number }
  | { type: 'SET_STATUS'; status: DiscussionState['status'] }
  | { type: 'SET_STANCES'; stances: Stance[] }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'UPDATE_MESSAGE'; id: string; content: string }
  | { type: 'SET_CURRENT_ROUND'; round: number }
  | { type: 'SET_SUMMARY'; summary: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' };

interface State {
  models: Model[];
  topic: string;
  rounds: number;
  discussion: DiscussionState;
}

const initialState: State = {
  models: [],
  topic: '',
  rounds: 3,
  discussion: {
    status: 'idle',
    topic: '',
    rounds: 3,
    currentRound: 0,
    stances: [],
    messages: [],
    summary: '',
  },
};

function readStoredModels(): Model[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index): Model | null => {
        if (!item || typeof item !== 'object') return null;
        const source = item as Record<string, unknown>;
        const apiUrl = typeof source.apiUrl === 'string' ? source.apiUrl.trim() : '';
        const apiKey = typeof source.apiKey === 'string' ? source.apiKey.trim() : '';
        const modelName = typeof source.modelName === 'string' ? source.modelName.trim() : '';
        if (!apiUrl || !apiKey || !modelName) return null;

        return {
          id: typeof source.id === 'string' && source.id.trim() ? source.id.trim() : `model-${index + 1}`,
          apiUrl,
          apiKey,
          modelName,
          isReferee: source.isReferee === true,
        };
      })
      .filter((model): model is Model => Boolean(model))
      .slice(0, 5);
  } catch {
    return [];
  }
}

function persistModels(models: Model[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(models));
}

function ensureOneReferee(models: Model[]): Model[] {
  if (models.length === 0) return [];
  if (models.some(model => model.isReferee)) return models;
  return models.map((model, index) => ({ ...model, isReferee: index === 0 }));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MODELS':
      return { ...state, models: action.models };
    case 'SET_TOPIC':
      return { ...state, topic: action.topic };
    case 'SET_ROUNDS':
      return { ...state, rounds: action.rounds };
    case 'SET_STATUS':
      return { ...state, discussion: { ...state.discussion, status: action.status } };
    case 'SET_STANCES':
      return { ...state, discussion: { ...state.discussion, stances: action.stances } };
    case 'ADD_MESSAGE': {
      const exists = state.discussion.messages.find(m => m.id === action.message.id);
      if (exists) return state;
      return {
        ...state,
        discussion: {
          ...state.discussion,
          messages: [...state.discussion.messages, action.message],
        },
      };
    }
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        discussion: {
          ...state.discussion,
          messages: state.discussion.messages.map(m =>
            m.id === action.id ? { ...m, content: m.content + action.content } : m
          ),
        },
      };
    case 'SET_CURRENT_ROUND':
      return { ...state, discussion: { ...state.discussion, currentRound: action.round } };
    case 'SET_SUMMARY':
      return { ...state, discussion: { ...state.discussion, summary: action.summary } };
    case 'SET_ERROR':
      return { ...state, discussion: { ...state.discussion, status: 'error', error: action.error } };
    case 'RESET':
      return {
        ...state,
        discussion: {
          status: 'idle',
          topic: state.topic,
          rounds: state.rounds,
          currentRound: 0,
          stances: [],
          messages: [],
          summary: '',
        },
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
  fetchModels: () => Promise<void>;
  addModel: (apiUrl: string, apiKey: string, modelName: string) => Promise<void>;
  removeModel: (id: string) => Promise<void>;
  setReferee: (id: string) => Promise<void>;
  startDiscussion: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchModels = useCallback(async () => {
    const models = ensureOneReferee(readStoredModels());
    persistModels(models);
    dispatch({ type: 'SET_MODELS', models });
  }, []);

  const addModel = useCallback(async (apiUrl: string, apiKey: string, modelName: string) => {
    if (state.models.length >= 5) {
      throw new Error('最多支持5个模型');
    }

    const model: Model = {
      id: `model-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      apiUrl: apiUrl.trim(),
      apiKey: apiKey.trim(),
      modelName: modelName.trim(),
      isReferee: state.models.length === 0,
    };

    if (!model.apiUrl || !model.apiKey || !model.modelName) {
      throw new Error('请填写完整的模型信息');
    }

    const models = ensureOneReferee([...state.models, model]);
    persistModels(models);
    dispatch({ type: 'SET_MODELS', models });
  }, [state.models]);

  const removeModel = useCallback(async (id: string) => {
    const models = ensureOneReferee(state.models.filter(m => m.id !== id));
    persistModels(models);
    dispatch({ type: 'SET_MODELS', models });
  }, [state.models]);

  const setReferee = useCallback(async (id: string) => {
    const models = state.models.map(m => ({ ...m, isReferee: m.id === id }));
    persistModels(models);
    dispatch({ type: 'SET_MODELS', models });
  }, [state.models]);

  const startDiscussion = useCallback(() => {
    const referee = state.models.find(m => m.isReferee);
    const completeModels = state.models.filter(m => m.apiUrl.trim() && m.apiKey.trim() && m.modelName.trim());

    if (completeModels.length < 2) {
      dispatch({ type: 'SET_ERROR', error: '请先在本机浏览器添加至少 2 个完整模型配置' });
      return;
    }

    if (!referee) {
      dispatch({ type: 'SET_ERROR', error: '请选择兼任主持人' });
      return;
    }

    dispatch({ type: 'RESET' });
    dispatch({ type: 'SET_STATUS', status: 'generating_stances' });

    fetch('/api/discussion/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: state.topic,
        rounds: state.rounds,
        models: completeModels,
        refereeId: referee.id,
      }),
    }).then(async res => {
      if (!res.ok) {
        const data = await res.json();
        dispatch({ type: 'SET_ERROR', error: data.error || '讨论启动失败' });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/m);
          if (!match) continue;

          try {
            const event: SSEEvent = JSON.parse(match[1]);
            handleSSEEvent(event);
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }
    }).catch(err => {
      dispatch({ type: 'SET_ERROR', error: err.message });
    });

    function handleSSEEvent(event: SSEEvent) {
      switch (event.type) {
        case 'status':
          dispatch({ type: 'SET_STATUS', status: event.status });
          break;
        case 'stances':
          dispatch({ type: 'SET_STANCES', stances: event.stances });
          break;
        case 'round_start':
          dispatch({ type: 'SET_CURRENT_ROUND', round: event.data.round });
          break;
        case 'message_start':
          dispatch({
            type: 'ADD_MESSAGE',
            message: {
              ...event.data,
              content: '',
            } as Message,
          });
          break;
        case 'message_chunk':
          dispatch({
            type: 'UPDATE_MESSAGE',
            id: event.data.messageId,
            content: event.data.chunk,
          });
          break;
        case 'summary':
          dispatch({ type: 'SET_SUMMARY', summary: (event as { summary: string }).summary });
          break;
        case 'complete':
          dispatch({ type: 'SET_STATUS', status: 'completed' });
          break;
        case 'error':
          dispatch({ type: 'SET_ERROR', error: event.error });
          break;
      }
    }
  }, [state.topic, state.rounds, state.models]);

  return (
    <AppContext.Provider value={{ state, dispatch, fetchModels, addModel, removeModel, setReferee, startDiscussion }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
