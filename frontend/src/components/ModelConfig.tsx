import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Globe, Key, Brain, Gavel } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ModelConfig() {
  const { state, addModel, removeModel, setReferee } = useApp();
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!apiUrl || !apiKey || !modelName) {
      setError('请填写完整信息');
      return;
    }
    try {
      await addModel(apiUrl, apiKey, modelName);
      setApiUrl('');
      setApiKey('');
      setModelName('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSetReferee = async (id: string) => {
    try {
      await setReferee(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const refereeId = state.models.find(m => m.isReferee)?.id;

  return (
    <div className="space-y-3">
      {/* 已有模型列表 */}
      <div className="space-y-2 max-h-44 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {state.models.map((model) => (
            <motion.div
              key={model.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`group flex items-center gap-2 p-3 rounded-lg border transition-all ${
                model.isReferee
                  ? 'bg-pink-50 border-accent-fire shadow-[3px_3px_0px_rgba(17,17,19,0.85)]'
                  : 'bg-white border-zinc-200 shadow-[2px_2px_0px_rgba(17,17,19,0.25)]'
              }`}
            >
              <button
                onClick={() => handleSetReferee(model.id)}
                className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  model.isReferee
                    ? 'bg-zinc-950 border-zinc-950 text-accent-fire shadow-sm'
                    : 'border-zinc-300 hover:border-accent-fire bg-white text-zinc-400'
                }`}
                title={model.isReferee ? '当前主持人' : '设为兼任主持人'}
                aria-label={model.isReferee ? '当前主持人' : `设 ${model.modelName} 为兼任主持人`}
              >
                {model.isReferee && <Gavel className="w-3.5 h-3.5" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-display font-bold text-zinc-800 truncate">{model.modelName}</p>
                  {model.isReferee && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-950 text-accent-fire font-bold border border-zinc-700">
                      兼任主持人
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 truncate font-semibold">{model.apiUrl}</p>
              </div>

              <button
                onClick={() => removeModel(model.id)}
                aria-label={`删除 ${model.modelName}`}
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 border border-transparent hover:border-red-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {state.models.length === 0 && (
          <p className="text-xs text-zinc-400 text-center py-2 font-semibold">
            暂无模型，本项目不内置任何模型配置
          </p>
        )}
      </div>

      <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">
        配置只保存在当前浏览器的 localStorage；后端不会保存模型地址或 API Key。
      </p>

      {/* 提示 */}
      {!refereeId && state.models.length >= 2 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-accent-fire font-bold text-center leading-relaxed"
        >
          点一个模型兼任主持人：负责控场，也必须亲自下场嘴两句
        </motion.p>
      )}

      {/* 添加模型表单 */}
      <div className="space-y-2">
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={apiUrl}
            onChange={e => setApiUrl(e.target.value)}
            placeholder="API 地址"
            className="w-full clay-input pl-10 pr-3 py-2.5 text-xs text-zinc-700 placeholder-zinc-400 font-body"
          />
        </div>
        <div className="relative">
          <Brain className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={modelName}
            onChange={e => setModelName(e.target.value)}
            placeholder="模型名称"
            className="w-full clay-input pl-10 pr-3 py-2.5 text-xs text-zinc-700 placeholder-zinc-400 font-body"
          />
        </div>
        <div className="relative">
          <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="API Key"
            className="w-full clay-input pl-10 pr-3 py-2.5 text-xs text-zinc-700 placeholder-zinc-400 font-body"
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 font-bold"
          >
            {error}
          </motion.p>
        )}

        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 clay-btn text-xs font-bold text-zinc-600 hover:text-accent-fire cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          添加模型
        </button>
      </div>
    </div>
  );
}
