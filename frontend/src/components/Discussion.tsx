import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import ChatBubble from './ChatBubble';
import StanceTag from './StanceTag';
import BickerBrief from './BickerBrief';
import { Swords, CheckCircle, AlertTriangle, ScrollText } from 'lucide-react';

export default function Discussion() {
  const { state } = useApp();
  const { discussion } = state;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showBrief, setShowBrief] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [discussion.messages]);

  if (discussion.status === 'idle' && discussion.messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <motion.div
            animate={{ rotate: [-8, 8, -8], y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 mx-auto rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-center shadow-[7px_7px_0px_rgba(236,72,153,0.85)]"
          >
            <Swords className="w-9 h-9 text-accent-fire" />
          </motion.div>
          <h3 className="text-3xl font-display font-bold text-zinc-900">今晚谁先破防</h3>
          <p className="text-base text-zinc-500 max-w-sm font-semibold leading-relaxed">
            拉至少 2 个模型进棚，钦点一位兼任主持人，给个题，然后把麦递出去
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div ref={scrollRef} className="h-full overflow-y-auto space-y-5">
        <AnimatePresence>
          {discussion.status === 'generating_stances' && discussion.stances.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white border border-zinc-200 rounded-lg p-5 shadow-[4px_4px_0px_rgba(17,17,19,0.18)]"
            >
              <div className="flex items-center gap-4">
                <span className="signal-loader" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <div>
                  <p className="text-sm font-display font-bold text-zinc-800">主持人正在给嘉宾贴人设</p>
                  <p className="text-xs font-bold text-zinc-400 mt-1">稍等，正在决定谁负责嘴硬，谁负责泼冷水。</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 立场分配 */}
          {discussion.stances.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white border border-zinc-200 rounded-lg p-5 shadow-[4px_4px_0px_rgba(17,17,19,0.18)]"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-center">
                  <Swords className="w-4 h-4 text-accent-fire" />
                </div>
                <h3 className="text-base font-display font-bold text-zinc-800">今晚人设牌</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {discussion.stances.map((stance) => (
                  <div
                    key={stance.modelId}
                    className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg shadow-[2px_2px_0px_rgba(17,17,19,0.18)]"
                  >
                    <span className="text-sm font-display font-bold text-zinc-800">{stance.modelName}</span>
                    <StanceTag stance={stance.stance} type={stance.type} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 消息列表 */}
          {discussion.messages.map((msg, idx) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isTyping={
                idx === discussion.messages.length - 1 &&
                discussion.status === 'discussing' &&
                !msg.content
              }
            />
          ))}

          {/* 总结阶段 */}
          {discussion.status === 'summarizing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 py-6"
            >
              <span className="signal-loader" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="text-base font-display font-bold text-accent-boom">主持人正在写赛后小作文...</span>
            </motion.div>
          )}

          {/* 完成状态 */}
          {discussion.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-base font-display font-bold text-green-600">收麦，今晚有瓜</span>
              </div>
              {discussion.summary && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBrief(true)}
                  className="flex items-center gap-2 px-6 py-3 clay-btn-primary text-sm font-display font-bold"
                >
                  <ScrollText className="w-4 h-4" />
                  生成辩论简报
                </motion.button>
              )}
            </motion.div>
          )}

          {/* 错误状态 */}
          {discussion.status === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 py-6"
            >
              <div className="w-8 h-8 rounded-xl bg-red-100 border-2 border-red-200 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-base font-display font-bold text-red-500">{discussion.error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 简报弹窗 */}
      {showBrief && (
        <BickerBrief discussion={discussion} onClose={() => setShowBrief(false)} />
      )}
    </>
  );
}
