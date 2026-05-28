import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import ModelConfig from './ModelConfig';
import StatusBar from './StatusBar';
import { Settings, MessageSquare, Hash, ChevronLeft, ChevronRight, Mic2 } from 'lucide-react';

export default function Sidebar() {
  const { state, dispatch, startDiscussion, fetchModels } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);

  useEffect(() => {
    fetchModels();
    fetch('/api/config')
      .then(r => r.json())
      .then(config => {
        setTopic(config.topic);
        setRounds(config.rounds);
        dispatch({ type: 'SET_TOPIC', topic: config.topic });
        dispatch({ type: 'SET_ROUNDS', rounds: config.rounds });
      });
  }, []);

  const refereeSelected = state.models.some(m => m.isReferee);
  const canStart = state.models.length >= 2 && topic.trim() && state.discussion.status === 'idle' && refereeSelected;

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 72 : 400 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-3 top-20 bottom-3 z-40 flex flex-col"
      >
        <div className="h-full clay-card flex flex-col overflow-hidden">
          {/* 折叠按钮 */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? '展开设置面板' : '收起设置面板'}
            className="absolute -right-3 top-6 w-7 h-7 bg-white border border-zinc-300 rounded-full flex items-center justify-center text-zinc-500 hover:text-accent-fire transition-colors z-50 clay-btn"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          <div className={`flex-1 overflow-y-auto p-5 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200 space-y-5`}>
            {/* 状态栏 */}
            <StatusBar />

            {/* 讨论主题 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-accent-fire" />
                </div>
                <h3 className="text-base font-display font-bold text-zinc-800">今晚开题</h3>
              </div>
              <textarea
                value={topic}
                onChange={e => {
                  setTopic(e.target.value);
                  dispatch({ type: 'SET_TOPIC', topic: e.target.value });
                }}
                placeholder="比如：人工智能会取代人类工作吗？"
                rows={3}
                className="w-full clay-input px-4 py-3 text-sm text-zinc-700 placeholder-zinc-400 resize-none font-body"
              />
            </div>

            {/* 讨论设置 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-accent-boom" />
                </div>
                <h3 className="text-base font-display font-bold text-zinc-800">场控</h3>
              </div>
              <div className="bg-white/70 border border-zinc-200 rounded-lg p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-500">
                      <Hash className="w-4 h-4" />
                      <span>麦克风转几圈</span>
                    </div>
                    <span className="text-lg font-display font-bold text-accent-fire">{rounds}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={rounds}
                    onChange={e => {
                      const v = parseInt(e.target.value);
                      setRounds(v);
                      dispatch({ type: 'SET_ROUNDS', rounds: v });
                    }}
                    className="w-full h-2 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-accent-fire"
                  />
                  <div className="flex justify-between text-xs font-bold text-zinc-400 mt-1">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 模型配置 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-accent-cold" />
                </div>
                <h3 className="text-base font-display font-bold text-zinc-800">嘉宾与主持</h3>
              </div>
              <div className="bg-white/70 border border-zinc-200 rounded-lg p-4">
                <ModelConfig />
              </div>
            </div>
          </div>

          {/* 开始按钮 */}
          <div className={`p-5 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
            <motion.button
              whileHover={{ scale: canStart ? 1.03 : 1 }}
              whileTap={{ scale: canStart ? 0.97 : 1 }}
              onClick={startDiscussion}
              disabled={!canStart}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-base font-display font-bold transition-all duration-200 ${
                canStart
                  ? 'clay-btn-primary'
                  : 'clay-btn text-zinc-400 cursor-not-allowed'
              }`}
            >
              <Mic2 className="w-5 h-5" />
              {canStart ? '开麦！' : state.models.length < 2 ? '还差嘉宾' : !refereeSelected ? '钦点主持人' : '先给个题'}
            </motion.button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
