/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api';
import { User, Message } from '../../types';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { MessageSquare, Send, Mail, MailOpen } from 'lucide-react';

interface InternMessagesProps {
  user: User;
}

export const InternMessages: React.FC<InternMessagesProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    setupRealtime();
  }, [user.id]);

  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      // Only mark messages as read if there are unread messages from the selected user
      const unreadMessages = messages.filter(
        m => m.from_id === selectedUser.id && m.to_id === user.id && !m.read
      );
      
      if (unreadMessages.length > 0) {
        api.markMessagesRead(user.id, selectedUser.id).catch(err => {
          console.error('Failed to mark messages as read:', err);
        });
      }
    }
  }, [selectedUser]); // Only run when selectedUser changes, not on every message update

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get all users who are managers or tech leads
      const allUsers = await api.getUsers();
      const supervisors = allUsers.filter(u => u.role === 'manager' || u.role === 'tech_lead');
      setUsers(supervisors);

      // If there's a tech lead assigned, select them by default
      if (user.assigned_tech_lead_id) {
        const techLead = supervisors.find(u => u.id === user.assigned_tech_lead_id);
        if (techLead) {
          setSelectedUser(techLead);
          const msgs = await api.getMessages(user.id, techLead.id);
          setMessages(msgs);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = async () => {
    try {
      const supabase = await getSupabaseClient();
      const channel = supabase
        .channel(`intern-messages-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Message' },
          async () => {
            if (selectedUser) {
              const msgs = await api.getMessages(user.id, selectedUser.id);
              setMessages(msgs);
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.warn('Realtime subscriptions are inactive in InternMessages:', error);
    }
  };

  const handleSelectUser = async (selectedSupervisor: User) => {
    setSelectedUser(selectedSupervisor);
    try {
      const msgs = await api.getMessages(user.id, selectedSupervisor.id);
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
        from_id: user.id,
        to_id: selectedUser.id,
        content: text
      });
      setMessages(prev => [...prev, newMsg]);
      setChatInput('');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (error) {
      alert("Failed to send message");
    }
  };

  const getUnreadCount = (supervisorId: string) => {
    return messages.filter(m => m.from_id === supervisorId && m.to_id === user.id && !m.read).length;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600 dark:text-slate-400">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Contacts List */}
      <div className="md:col-span-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-teal-400" />
            Messages
          </h3>
        </div>
        <div className="overflow-y-auto h-[calc(600px-60px)]">
          {users.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-white/60">No contacts available</p>
            </div>
          ) : (
            users.map(supervisor => {
              const unreadCount = getUnreadCount(supervisor.id);
              const isActive = selectedUser?.id === supervisor.id;
              
              return (
                <motion.div
                  key={supervisor.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleSelectUser(supervisor)}
                  className={`p-4 cursor-pointer border-b border-white/10 transition-colors ${
                    isActive
                      ? 'bg-teal-500/20 border-l-4 border-l-teal-400'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={supervisor.avatar}
                      alt={supervisor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {supervisor.name}
                      </p>
                      <p className="text-xs text-white/60 capitalize">
                        {supervisor.role.replace('_', ' ')}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <div className="bg-teal-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="md:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">Select a contact to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/20 bg-gradient-to-r from-teal-500/20 to-cyan-500/20">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-white/60 capitalize">
                    {selectedUser.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-white/40 mx-auto mb-2" />
                  <p className="text-sm text-white/60">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isFromMe = msg.from_id === user.id;
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isFromMe
                            ? 'bg-teal-600 text-white'
                            : 'bg-white/10 text-white/90'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
                          <span>
                            {new Date(msg.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                          {isFromMe && (
                            msg.read ? (
                              <MailOpen className="h-3 w-3" />
                            ) : (
                              <Mail className="h-3 w-3" />
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </motion.button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
