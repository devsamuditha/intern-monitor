/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api.ts';
import { User, Question, Reply } from '../../types.ts';
import { MessageSquare, Send, Sparkles, UserCheck, CornerDownRight } from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers.ts';
import { getSupabaseClient } from '../../lib/supabaseClient.ts';

interface AskTeamThreadProps {
  currentUser: User;
}

export const AskTeamThread: React.FC<AskTeamThreadProps> = ({ currentUser }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyText, setReplyText] = useState<{ [qId: string]: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usersMap, setUsersMap] = useState<{ [id: string]: User }>({});

  const loadData = async () => {
    try {
      const [qs, users] = await Promise.all([
        api.getQuestions(),
        api.getUsers()
      ]);
      setQuestions(qs);
      
      const uMap: { [id: string]: User } = {};
      users.forEach(u => { uMap[u.id] = u; });
      setUsersMap(uMap);
    } catch (err: any) {
      console.error("Error loading questions", err);
      setError("Failed to load discussion boards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        subscriptionChannel = supabase
          .channel('ask-the-team-discussion')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Question' },
            () => {
              loadData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Reply' },
            () => {
              loadData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in AskTeamThread:", err);
      }
    };

    setupRealtime();

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, []);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please fill out both the title and question body.");
      return;
    }

    try {
      setError('');
      await api.askQuestion({
        intern_id: currentUser.id,
        title: title.trim(),
        content: content.trim()
      });
      setTitle('');
      setContent('');
      setSuccess("Question posted successfully! ✨");
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to post question.");
    }
  };

  const handlePostReply = async (questionId: string) => {
    const text = replyText[questionId]?.trim();
    if (!text) return;

    try {
      setError('');
      await api.replyToQuestion(questionId, {
        user_id: currentUser.id,
        content: text
      });
      setReplyText(prev => ({ ...prev, [questionId]: '' }));
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to post reply.");
    }
  };

  const getUserDetails = (userId: string) => {
    return usersMap[userId] || {
      id: userId,
      name: "Team Member",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      role: "intern" as const
    };
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'tech_lead':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'manager') return 'Manager';
    if (role === 'tech_lead') return 'Tech Lead';
    return 'Intern';
  };

  return (
    <div id="ask-team-discussion-board" className="space-y-6">
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-6">
<h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
           Ask the Team <MessageSquare className="h-5 w-5 text-teal-600" />
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Stuck on a blocker, database schema issue, or need review guidance? Post your question here and let leads or managers jump in.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs border border-rose-100 dark:border-rose-900/40">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs border border-emerald-100 dark:border-emerald-900/40">
            {success}
          </div>
        )}

        {/* Question Submission Form (Only Interns typically ask, but allow anyone for ease) */}
        <form onSubmit={handleAskQuestion} className="space-y-3">
          <div>
            <input 
              type="text"
              placeholder="What are you struggling with? (e.g., Redis TTL policies)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
            />
          </div>
          <div>
            <textarea
              rows={3}
              placeholder="Describe the context, what you have tried, and paste relevant logs or code snippets..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              Post Question <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Discussion List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Discussions</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading channels...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-12 text-center">
            <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">All quiet in the discussion rooms</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to post a question and start collaborating!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const author = getUserDetails(q.intern_id);
              return (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-slate-700/30 shadow-sm space-y-4"
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3">
                    <img src={author.avatar} alt={author.name} className="h-9 w-9 rounded-full object-cover border" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{author.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getRoleBadge(author.role)}`}>
                          {getRoleLabel(author.role)}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatRelativeTime(q.timestamp)}</span>
                      </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{q.title}</h4>
                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${q.isHidden ? 'text-slate-300 dark:text-slate-600 italic' : 'text-slate-600 dark:text-slate-300'} mt-1`}>
                          {q.isHidden ? '[removed]' : q.content}
                        </p>
                    </div>
                  </div>

                  {/* Threaded replies */}
                  {q.replies.length > 0 && (
                    <div className="pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-3.5 mt-2">
                      {q.replies.map((reply) => {
                        const replier = getUserDetails(reply.user_id);
                        const isLeadOrManager = replier.role === 'tech_lead' || replier.role === 'manager';
                        return (
                          <div key={reply.id} className="flex gap-2.5 items-start">
                            <CornerDownRight className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                            <img src={replier.avatar} alt={replier.name} className="h-7 w-7 rounded-full object-cover border" referrerPolicy="no-referrer" />
                            <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl min-w-0 border border-slate-200 dark:border-slate-900">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className="text-xs font-semibold text-slate-900 dark:text-white">{replier.name}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-semibold ${getRoleBadge(replier.role)}`}>
                                  {getRoleLabel(replier.role)}
                                </span>
                                {isLeadOrManager && (
                                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded font-medium">
                                    <UserCheck className="h-2.5 w-2.5" /> Approved Guide
                                  </span>
                                )}
                                <span className="text-[9px] text-slate-400 ml-auto">{formatRelativeTime(reply.timestamp)}</span>
                              </div>
                              <p className={`text-xs leading-relaxed whitespace-pre-wrap ${reply.isHidden ? 'text-slate-300 dark:text-slate-600 italic' : 'text-slate-700 dark:text-slate-300'}`}>
                                {reply.isHidden ? '[removed]' : reply.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply Form */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <input 
                      type="text"
                      placeholder="Offer help or ask a follow-up question..."
                      value={replyText[q.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostReply(q.id)}
                      className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <button
                      onClick={() => handlePostReply(q.id)}
                      className="p-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-xl transition"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};




