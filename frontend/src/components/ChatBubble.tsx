import { motion } from 'framer-motion';
import type { Message } from '../types';
import StanceTag from './StanceTag';
import { Bot } from 'lucide-react';

interface Props {
  message: Message;
  isTyping?: boolean;
}

export default function ChatBubble({ message, isTyping }: Props) {
  const waiting = isTyping && !message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-center shadow-[3px_3px_0px_rgba(236,72,153,0.75)]">
            <Bot className={`w-5 h-5 ${waiting ? 'text-accent-fire animate-pulse' : 'text-accent-cold'}`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-display font-bold text-zinc-800">{message.modelName}</span>
            <StanceTag stance={message.stance} type={message.stanceType} />
            <span className="text-xs font-bold text-zinc-400">第 {message.round} 圈</span>
          </div>

          <div className="relative">
            <div className="bg-white border border-zinc-200 rounded-lg rounded-tl-sm px-5 py-3.5 shadow-[4px_4px_0px_rgba(17,17,19,0.18)]">
              {waiting ? (
                <div className="flex items-center gap-3 text-sm text-zinc-500 font-bold min-h-[44px]">
                  <span className="signal-loader" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                  <span>正在憋一段不太想认输的发言...</span>
                </div>
              ) : (
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap font-body">
                  {message.content}
                  {isTyping && (
                    <span className="inline-block w-0.5 h-4 bg-accent-fire ml-0.5 animate-pulse" />
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
