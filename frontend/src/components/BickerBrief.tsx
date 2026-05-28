import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, X, Flame, Swords, Trophy } from 'lucide-react';
import type { DiscussionState } from '../types';

interface Props {
  discussion: DiscussionState;
  onClose: () => void;
}

export default function BickerBrief({ discussion, onClose }: Props) {
  const briefRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!briefRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(briefRef.current, {
        pixelRatio: 2,
        backgroundColor: '#EEF2FF',
      });
      const link = document.createElement('a');
      link.download = `爱扯皮-${discussion.topic.slice(0, 20)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('生成图片失败:', e);
    } finally {
      setDownloading(false);
    }
  }, [discussion.topic]);

  const stanceColors: Record<string, string> = {
    positive: '#4F46E5',
    negative: '#EF4444',
    neutral: '#EAB308',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(30, 27, 75, 0.4)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* 简报卡片（用于截图） */}
          <div
            ref={briefRef}
            className="relative rounded-[2rem] overflow-hidden border-[3px] border-indigo-200"
            style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 50%, #E0E7FF 100%)',
              boxShadow: '8px 8px 0px #A5B4FC',
            }}
          >
            {/* 顶部装饰 */}
            <div className="h-3 bg-gradient-to-r from-accent-fire via-accent-boom to-accent-cold" />

            <div className="p-8 space-y-6">
              {/* 标题区 */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Flame className="w-5 h-5 text-accent-fire" />
                  <span className="text-xs font-display font-bold tracking-widest text-accent-fire uppercase">
                    爱扯皮 · AI Bicker
                  </span>
                  <Flame className="w-5 h-5 text-accent-fire" />
                </div>
                <h2 className="text-2xl font-display font-black text-slate-800 leading-tight">
                  辩论简报
                </h2>
                <p className="text-sm text-indigo-500 font-bold">
                  {discussion.topic}
                </p>
              </div>

              {/* 阵营划分 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-display font-bold text-indigo-400 uppercase tracking-wider">
                  <Swords className="w-3.5 h-3.5" />
                  <span>阵营划分</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {discussion.stances.map((stance) => (
                    <div
                      key={stance.modelId}
                      className="flex items-center justify-between p-3 rounded-2xl border-[2.5px] bg-white"
                      style={{
                        borderColor: `${stanceColors[stance.type]}40`,
                        boxShadow: `3px 3px 0px ${stanceColors[stance.type]}30`,
                      }}
                    >
                      <span className="text-sm font-display font-bold text-slate-700">
                        {stance.modelName}
                      </span>
                      <span
                        className="text-xs font-display font-bold px-2.5 py-1 rounded-full border-[2px]"
                        style={{
                          backgroundColor: `${stanceColors[stance.type]}15`,
                          borderColor: `${stanceColors[stance.type]}40`,
                          color: stanceColors[stance.type],
                        }}
                      >
                        {stance.stance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 战况统计 */}
              <div className="flex items-center justify-center gap-6 py-3">
                <div className="text-center">
                  <div className="text-xl font-display font-black text-accent-fire">
                    {discussion.rounds}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase">总轮次</div>
                </div>
                <div className="w-px h-10 bg-indigo-200" />
                <div className="text-center">
                  <div className="text-xl font-display font-black text-accent-boom">
                    {discussion.messages.length}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase">发言数</div>
                </div>
                <div className="w-px h-10 bg-indigo-200" />
                <div className="text-center">
                  <div className="text-xl font-display font-black text-accent-cold">
                    {discussion.stances.length}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase">参战方</div>
                </div>
              </div>

              {/* 主持总结 */}
              {discussion.summary && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-display font-bold text-indigo-400 uppercase tracking-wider">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>主持人战报</span>
                  </div>
                  <div
                    className="p-4 rounded-2xl border-[2.5px] bg-white"
                    style={{
                      borderColor: '#C7D2FE',
                      boxShadow: '3px 3px 0px #A5B4FC',
                    }}
                  >
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-body">
                      {discussion.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* 底部装饰 */}
              <div className="pt-2 text-center">
                <p className="text-[10px] text-indigo-300 font-bold tracking-wider">
                  generated by 爱扯皮 · {new Date().toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>

            {/* 底部彩条 */}
            <div className="h-2 bg-gradient-to-r from-accent-fire via-accent-boom to-accent-cold" />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-3 clay-btn-primary text-sm font-display font-bold"
            >
              <Download className="w-4 h-4" />
              {downloading ? '生成中...' : '保存图片'}
            </motion.button>
            <button
              onClick={onClose}
              className="p-3 clay-btn text-indigo-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
