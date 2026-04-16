import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Search, User, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface Message {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  mensagem: string;
  lido: boolean;
  created_at: string;
}

export const ChatWidget: React.FC = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .neq('id', profile.id);
      
      if (data) setUsers(data);
    };

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('mensagens_chat')
        .select('*', { count: 'exact', head: true })
        .eq('destinatario_id', profile.id)
        .eq('lido', false);
      
      setUnreadCount(count || 0);
    };

    fetchUsers();
    fetchUnreadCount();

    // Real-time for unread count
    const channel = supabase
      .channel('unread-chat-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mensagens_chat',
        filter: `destinatario_id=eq.${profile.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      const userId = e.detail?.userId;
      if (userId) {
        const targetUser = users.find(u => u.id === userId);
        if (targetUser) {
          setSelectedUser(targetUser);
          setIsOpen(true);
        } else {
          // If user not in list yet, attempt to fetch it
          supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => {
            if (data) {
              setSelectedUser(data);
              setIsOpen(true);
            }
          });
        }
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, [users]);

  useEffect(() => {
    if (!selectedUser || !profile?.id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('mensagens_chat')
        .select('*')
        .or(`and(remetente_id.eq.${profile.id},destinatario_id.eq.${selectedUser.id}),and(remetente_id.eq.${selectedUser.id},destinatario_id.eq.${profile.id})`)
        .order('created_at', { ascending: true });
      
      if (data) {
        setMessages(data);
        // Mark as read
        const unreadIds = data
          .filter(m => m.destinatario_id === profile.id && !m.lido)
          .map(m => m.id);
        
        if (unreadIds.length > 0) {
          await supabase
            .from('mensagens_chat')
            .update({ lido: true })
            .in('id', unreadIds);
        }
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens_chat'
      }, (payload: any) => {
        const msg = payload.new as Message;
        const isRelevant = 
          (msg.remetente_id === profile.id && msg.destinatario_id === selectedUser.id) ||
          (msg.remetente_id === selectedUser.id && msg.destinatario_id === profile.id);
        
        if (isRelevant) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          
          if (msg.destinatario_id === profile.id && !msg.lido) {
            supabase.from('mensagens_chat').update({ lido: true }).eq('id', msg.id).then();
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'mensagens_chat'
      }, (payload: any) => {
        const msg = payload.new as Message;
        if (msg.remetente_id === profile.id || msg.destinatario_id === profile.id) {
          setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, profile?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !profile?.id) return;

    const messageObj = {
      remetente_id: profile.id,
      destinatario_id: selectedUser.id,
      mensagem: newMessage.trim()
    };

    const { data, error } = await supabase
      .from('mensagens_chat')
      .insert(messageObj)
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => [...prev, data as Message]);
      setNewMessage('');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'hsl(var(--primary))',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 20px hsla(var(--primary), 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        className="chat-toggle-btn"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {unreadCount > 0 && !isOpen && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            minWidth: '22px',
            height: '22px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: 0,
          width: '380px',
          height: '550px',
          backgroundColor: 'hsl(var(--bg-card))',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out',
          border: '1px solid hsl(var(--border-light))'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.25rem',
            background: 'hsl(var(--primary))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {selectedUser && (
              <button 
                onClick={() => setSelectedUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                {selectedUser ? selectedUser.full_name : 'Chat Interno'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>
                {selectedUser ? (selectedUser.role === 'admin' ? 'Administrador' : selectedUser.role === 'psicologo' ? 'Psicólogo' : 'Recepcionista') : 'Selecione um usuário para conversar'}
              </p>
            </div>
          </div>

          {!selectedUser ? (
            /* User List View */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border-light))' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                  <input
                    type="text"
                    placeholder="Buscar usuários..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border-light))',
                      backgroundColor: 'hsl(var(--bg-main))',
                      color: 'hsl(var(--text-main))',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }} className="custom-scrollbar">
                {filteredUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
                    Nenhum usuário encontrado.
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        transition: 'all 0.2s'
                      }}
                      className="chat-user-item"
                    >
                      <div translate="no" style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '50%', 
                        background: 'hsla(var(--primary), 0.1)',
                        color: 'hsl(var(--primary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem'
                      }}>
                        {user.full_name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>{user.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'capitalize' }}>
                          {user.role}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Chat Messages View */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }} className="custom-scrollbar">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                    Nenhuma mensagem ainda. Comece a conversa!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.remetente_id === profile?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start',
                          marginBottom: '1rem'
                        }}
                      >
                        <div style={{
                          maxWidth: '85%',
                          padding: '0.75rem 1rem',
                          borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                          backgroundColor: isMine ? 'hsl(var(--primary))' : 'hsl(var(--bg-main))',
                          color: isMine ? 'white' : 'hsl(var(--text-main))',
                          fontSize: '0.9rem',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                          wordBreak: 'break-word'
                        }}>
                          {msg.mensagem}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {isMine && (
                            <span style={{ marginLeft: '0.5rem', color: msg.lido ? 'hsl(var(--primary))' : 'inherit' }}>
                              {msg.lido ? 'Lido' : 'Enviado'}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form 
                onSubmit={handleSendMessage}
                style={{
                  padding: '1rem',
                  borderTop: '1px solid hsl(var(--border-light))',
                  display: 'flex',
                  gap: '0.5rem'
                }}
              >
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '24px',
                    border: '1px solid hsl(var(--border-light))',
                    backgroundColor: 'hsl(var(--bg-main))',
                    color: 'hsl(var(--text-main))',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: newMessage.trim() ? 'pointer' : 'default',
                    opacity: newMessage.trim() ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .chat-toggle-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px hsla(var(--primary), 0.5);
        }
        .chat-user-item:hover {
          background-color: hsla(var(--primary), 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsla(var(--primary), 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsla(var(--primary), 0.4);
        }
      `}</style>
    </div>
  );
};
