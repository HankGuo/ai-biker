import { motion } from 'framer-motion';
import { AudioLines, Radio } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
      className="fixed top-3 left-3 right-3 z-50"
    >
      <div
        className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between clay-card"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-9 h-9 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-700 shadow-sm"
          >
            <Radio className="w-5 h-5 text-accent-fire" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-zinc-900">
            爱扯皮
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm font-body font-bold text-zinc-500">
          <AudioLines className="w-4 h-4 text-accent-cold" />
          <span>AI 争论现场</span>
        </div>
      </div>
    </motion.header>
  );
}
