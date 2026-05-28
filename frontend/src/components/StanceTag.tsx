import { motion } from 'framer-motion';

interface Props {
  stance: string;
  type: 'positive' | 'negative' | 'neutral';
}

const config = {
  positive: {
    bg: '#ECFDF5',
    border: '#14B8A6',
    text: '#0F766E',
    shadow: 'rgba(17, 17, 19, 0.7)',
  },
  negative: {
    bg: '#FEF2F2',
    border: '#EF4444',
    text: '#EF4444',
    shadow: 'rgba(17, 17, 19, 0.7)',
  },
  neutral: {
    bg: '#FFFBEB',
    border: '#F59E0B',
    text: '#B45309',
    shadow: 'rgba(17, 17, 19, 0.7)',
  },
};

export default function StanceTag({ stance, type }: Props) {
  const c = config[type];
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-extrabold tracking-normal border"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        color: c.text,
        boxShadow: `2px 2px 0px ${c.shadow}`,
      }}
    >
      {stance}
    </motion.span>
  );
}
