import { useApp } from '../context/AppContext';
import { Users, Mic2, AlertTriangle } from 'lucide-react';

export default function StatusBar() {
  const { state } = useApp();
  const { models, discussion } = state;

  const statusConfig = {
    idle: { text: '棚内待命', color: 'text-zinc-500', icon: Mic2 },
    generating_stances: { text: '主持人正在分配奇怪人设...', color: 'text-accent-fire', icon: Mic2 },
    discussing: { text: `第 ${discussion.currentRound} 圈麦克风已递出`, color: 'text-accent-cold', icon: Mic2 },
    summarizing: { text: '主持人憋赛后小作文中...', color: 'text-accent-boom', icon: Mic2 },
    completed: { text: '收麦，今晚有瓜', color: 'text-green-600', icon: Mic2 },
    error: { text: discussion.error || '翻车了', color: 'text-red-500', icon: AlertTriangle },
  };

  const current = statusConfig[discussion.status];
  const Icon = current.icon;

  return (
    <div className="flex items-center gap-4 text-sm font-body">
      <div className="flex items-center gap-2 text-zinc-500">
        <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-accent-cold" />
        </div>
        <span className="font-semibold">
          来了 <span className="text-accent-fire font-bold">{models.length}</span> 个选手
        </span>
      </div>
      <div className={`flex items-center gap-2 ${current.color}`}>
        <Icon className="w-4 h-4 animate-pulse" />
        <span className="font-bold">{current.text}</span>
      </div>
    </div>
  );
}
