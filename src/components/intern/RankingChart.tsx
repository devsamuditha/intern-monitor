import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api';
import { ThemedIcon } from '../ui/ThemedIcon';
import { Trophy, Star } from 'lucide-react';
import { fadeInUp, staggerContainer } from '../../utils/motion';

interface RankingChartProps {
  currentUserId: string;
}

interface RankingItem {
  internId: string;
  name: string;
  avatar: string;
  overallAvg: number;
  thisWeekAvg: number | null;
  totalMarks: number;
}

export const RankingChart: React.FC<RankingChartProps> = ({ currentUserId }) => {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const data = await api.getInternRanking();
      setRanking(data.ranking || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-32"></div>
          <div className="h-5 bg-white/10 rounded w-full"></div>
          <div className="h-5 bg-white/10 rounded w-full"></div>
          <div className="h-5 bg-white/10 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 p-6">
        <p className="text-white/60 text-center py-4">Failed to load rankings.</p>
      </div>
    );
  }

  const topPerformer = ranking.length > 0 && ranking[0].thisWeekAvg !== null ? ranking[0] : null;

  const maxThisWeek = ranking.reduce((max, item) => {
    if (item.thisWeekAvg !== null && item.thisWeekAvg > max) return item.thisWeekAvg;
    return max;
  }, 0);

  const maxScore = maxThisWeek > 0 ? maxThisWeek : Math.max(...ranking.map(i => i.overallAvg), 0);

  if (ranking.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 p-6">
        <div className="flex items-center gap-2 mb-2">
          <ThemedIcon icon={Trophy} color="amber" size={20} fill />
          <h3 className="text-sm font-bold text-white">Intern Rankings</h3>
        </div>
        <p className="text-xs text-white/60 mb-4">Ranked by average score</p>
        <p className="text-white/60 text-center py-4 text-sm">No scores recorded yet.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 p-6 space-y-4"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
    >
      <div className="flex items-center gap-2">
        <ThemedIcon icon={Trophy} color="amber" size={20} fill />
        <h3 className="text-sm font-bold text-white">Intern Rankings</h3>
      </div>
      <p className="text-xs text-white/60">Ranked by average score</p>

      {topPerformer && (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-amber-400/30 shadow-lg shadow-amber-500/10 p-4 flex items-center gap-3">
          <img
            src={topPerformer.avatar || '/favicon.ico'}
            alt=""
            className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover bg-white/5"
          />
          <div>
            <p className="text-xs text-amber-300 font-bold">{topPerformer.name}</p>
            <p className="text-xs text-white/80">⭐ Top This Week: {topPerformer.thisWeekAvg} avg</p>
          </div>
        </div>
      )}

      <motion.div
        className="space-y-3"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {ranking.map((item) => {
          const score = item.thisWeekAvg ?? item.overallAvg;
          const widthPercent = maxScore > 0 ? (score / maxScore) * 100 : 0;
          const isTop = item.internId === ranking[0].internId && item.thisWeekAvg !== null;
          const isCurrentUser = item.internId === currentUserId;

          return (
            <motion.div
              key={item.internId}
              variants={fadeInUp}
              className={`flex items-center gap-3 ${isTop ? 'ring-2 ring-amber-400/50 rounded-xl p-2' : ''} ${isCurrentUser && !isTop ? 'bg-white/5 rounded-xl p-2' : ''}`}
            >
              <div className="w-8 shrink-0">
                <img
                  src={item.avatar || '/favicon.ico'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover bg-white/5"
                />
              </div>
              <div className="w-28 shrink-0">
                <p className={`text-xs font-bold truncate ${isCurrentUser ? 'text-teal-300' : 'text-white'}`}>
                  {item.name}
                </p>
                <p className="text-[10px] text-white/60">{item.totalMarks} marks</p>
              </div>
              <div className="flex-1 h-5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span className="text-xs font-black text-white w-16 text-right">
                {score}
                {item.thisWeekAvg !== null && (
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline ml-1" />
                )}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};
