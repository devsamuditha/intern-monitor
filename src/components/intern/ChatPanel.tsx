/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { User, Message } from '../../types';
import { getSupabaseClient } from '../../lib/supabaseClient';
import {
  MessageSquare, Send, X, UserCheck, Minimize2, Maximize2,
  CheckCheck, Clock, ExternalLink, Users
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';

interface ChatPanelProps {
  currentUser: User;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    loadData();
    let cleanup: (() => void) | undefined;
    setupRealtime().then((c) => { cleanup = c; });
    return () => {
      cleanup?.();
    };
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (selectedUser && isOpen) {
      const unreadMessages = messages.filter(
        m => m.from_id === selectedUser.id && m.to_id === currentUser.id && !m.read
      );
      if (unreadMessages.length > 0) {
        api.markMessagesRead(currentUser.id, selectedUser.id).catch(err => {
          console.error('Failed to mark messages as read:', err);
        });
      }
    }
  }, [selectedUser, isOpen, currentUser]);

  useEffect(() => {
    if (chatEndRef.current && isOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const allUsers = await api.getUsers();
      const supervisors = allUsers.filter(u => u.role === 'manager' || u.role === 'tech_lead');
      setUsers(supervisors);

      if (!selectedUser && supervisors.length > 0) {
        const techLead = supervisors.find(u => u.id === currentUser.assigned_tech_lead_id) || supervisors[0];
        setSelectedUser(techLead);
        const msgs = await api.getMessages(currentUser.id, techLead.id);
        setMessages(msgs);
      } else if (selectedUser) {
        const msgs = await api.getMessages(currentUser.id, selectedUser.id);
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = async () => {
    if (!currentUser || !isOpen) return;
    try {
      const supabase = await getSupabaseClient();
      const channel = supabase
        .channel(`chat-panel-${currentUser.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Message' },
          async () => {
            if (selectedUser) {
              const msgs = await api.getMessages(currentUser.id, selectedUser.id);
              setMessages(msgs);
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.warn('Realtime inactive in ChatPanel:', error);
    }
  };

  const handleSelectUser = async (target: User) => {
    setSelectedUser(target);
    setShowContacts(false);
    try {
      const msgs = await api.getMessages(currentUser.id, target.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !selectedUser) return;

    try {
      const newMsg = await api.sendMessage({
        from_id: currentUser.id,
        to_id: selectedUser.id,
        content: text
      });
      setMessages(prev => [...prev, newMsg]);
      setChatInput('');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getUnreadCount = (supervisorId: string) => {
    return messages.filter(m => m.from_id === supervisorId && m.to_id === currentUser.id && !m.read).length;
  };

  const unreadTotal = users.reduce((sum, u) => {
    const fromUser = messages.filter(m => m.from_id === u.id && m.to_id === currentUser.id && !m.read).length;
    const toUser = messages.filter(m => m.to_id === currentUser.id && m.from_id === u.id && !m.read).length;
    return sum;
  }, 0);

  const allUnread = users.filter(u => {
    const msgs = messages.filter(m => m.from_id === u.id && m.to_id === currentUser.id && !m.read);
    return msgs.length > 0;
  }).length;

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        type="button"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-2xl shadow-teal-500/30 flex items-center justify-center transition-all duration-200"
        title="Open Messages"
      >
        <MessageSquare className="h-6 w-6 fill-white/20" />
        {unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[60] w-80 sm:w-96 h-[600px] bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-2xl shadow-teal-500/10 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/20 dark:border-slate-700/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {selectedUser ? (
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-teal-500/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              )}
              {selectedUser && (
                <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  selectedUser ? 'bg-emerald-400' : 'bg-slate-400'
                }`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {selectedUser ? (
                <>
                  <h3 className="text-sm font-bold text-white truncate">
                    {selectedUser.name}
                  </h3>
                  <p className="text-[10px] text-slate-300 capitalize">
                    {selectedUser.role.replace('_', ' ')}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-white">Messages</h3>
                  <p className="text-[10px] text-slate-300">
                    Select a contact to start chatting
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowContacts(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              title="Contacts"
            >
              <Users className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contacts Overlay */}
        <AnimatePresence>
          {showContacts && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="absolute inset-0 bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl z-10 flex flex-col"
          >
            <div className="p-3 border-b border-white/20 dark:border-slate-700/30 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase">Contacts</h4>
              <button
                type="button"
                onClick={() => setShowContacts(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {users.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-400">No contacts available</p>
                </div>
              ) : (
                users.map(supervisor => {
                  const unreadCount = getUnreadCount(supervisor.id);
                  const isActive = selectedUser?.id === supervisor.id;
                  return (
                    <motion.div
                      key={supervisor.id}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      onClick={() => handleSelectUser(supervisor)}
                      className={`p-4 cursor-pointer border-b border-white/10 transition-colors flex items-center gap-3 ${
                        isActive ? 'bg-white/10 text-teal-300' : 'text-white'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={supervisor.avatar}
                          alt={supervisor.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/20 dark:border-slate-700/30"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {supervisor.name}
                        </p>
                        <p className="text-xs text-slate-300 capitalize">
                          {supervisor.role.replace('_', ' ')}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-teal-600 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        {!isMinimized && (
          <>
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageSquare className="h-10 w-10 text-slate-400 mb-3" />
                  <p className="text-xs text-slate-300">
                    {selectedUser ? 'Start a conversation!' : 'Select a contact to start messaging'}
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isFromMe = msg.from_id === currentUser.id;
                  const timeStr = formatRelativeTime(msg.timestamp);
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs relative ${
                          isFromMe
                            ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-br-md'
                            : 'bg-white/10 text-white rounded-bl-md'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${
                          isFromMe ? 'text-white/70' : 'text-slate-300'
                        } text-[9px] justify-end`}>
                          <Clock className="h-2.5 w-2.5" />
                          <span>{timeStr}</span>
                          {isFromMe && (
                            msg.read ? (
                              <CheckCheck className="h-2.5 w-2.5" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-white/30" />
                            )
                          )}
                         </div>
                       </div>
                     </motion.div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20 dark:border-slate-700/30">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={selectedUser ? `Message ${selectedUser.name}...` : 'Select a contact first...'}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={!selectedUser}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 text-xs text-white placeholder:text-[10px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50 transition-all"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!chatInput.trim() || !selectedUser}
                  className="p-2.5 bg-gradient-to-br from-teal-500 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};