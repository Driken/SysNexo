import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Search, User, ChevronLeft, Users, Plus, Check, MoreVertical, Trash2, UserPlus, Paperclip, Image as ImageIcon, Loader2, Shield, LogOut, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface Group {
  id: string;
  nome: string;
  criador_id: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  grupo_id: string;
  perfil_id: string;
  role: 'admin' | 'member';
  profiles?: Profile;
}

interface Message {
  id: string;
  remetente_id: string;
  destinatario_id: string | null;
  grupo_id: string | null;
  mensagem: string;
  midia_url: string | null;
  lido: boolean;
  created_at: string;
  profiles?: { full_name: string };
}

interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
}

export const ChatWidget: React.FC = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
  const [selectedRecipient, setSelectedRecipient] = useState<{ type: 'user' | 'group', data: Profile | Group } | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isShowingMembers, setIsShowingMembers] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<string[]>([]);
  const [currentGroupMembers, setCurrentGroupMembers] = useState<GroupMember[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'warning'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserGroupRole = currentGroupMembers.find(m => m.perfil_id === profile?.id)?.role;
  const isCreator = selectedRecipient?.type === 'group' && (selectedRecipient.data as Group).criador_id === profile?.id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchData = async () => {
    if (!profile?.id) return;
    try {
      const { data: usersData } = await supabase.from('profiles').select('*').eq('is_active', true).neq('id', profile.id);
      if (usersData) setUsers(usersData);
      const { data: groupsData } = await supabase.from('chat_grupos').select(`*, chat_grupo_membros!inner(perfil_id)`).eq('chat_grupo_membros.perfil_id', profile.id);
      if (groupsData) setGroups(groupsData as unknown as Group[]);
      const { count } = await supabase.from('mensagens_chat').select('*', { count: 'exact', head: true }).eq('destinatario_id', profile.id).eq('lido', false);
      setUnreadCount(count || 0);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchData();
    if (!profile?.id) return;
    const channel = supabase.channel('chat-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens_chat', filter: `destinatario_id=eq.${profile.id}` }, () => fetchData()).on('postgres_changes', { event: '*', schema: 'public', table: 'chat_grupos' }, () => fetchData()).on('postgres_changes', { event: '*', schema: 'public', table: 'chat_grupo_membros' }, () => { if (selectedRecipient?.type === 'group') fetchGroupMembers(selectedRecipient.data.id); fetchData(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, selectedRecipient?.data?.id]);

  const fetchGroupMembers = async (groupId: string) => {
    const { data: members } = await supabase.from('chat_grupo_membros').select('*, profiles(*)').eq('grupo_id', groupId);
    if (members) setCurrentGroupMembers(members as any);
  };

  useEffect(() => {
    if (!selectedRecipient || !profile?.id) { setMessages([]); setIsShowingMembers(false); return; }
    const fetchMessages = async () => {
      let query = supabase.from('mensagens_chat').select('*, profiles(full_name)');
      if (selectedRecipient.type === 'user') {
        const userId = selectedRecipient.data.id;
        query = query.or(`and(remetente_id.eq.${profile.id},destinatario_id.eq.${userId}),and(remetente_id.eq.${userId},destinatario_id.eq.${profile.id})`);
      } else {
        const groupId = selectedRecipient.data.id;
        query = query.eq('grupo_id', groupId);
        fetchGroupMembers(groupId);
      }
      const { data } = await query.order('created_at', { ascending: true });
      if (data) { setMessages(data as any); if (selectedRecipient.type === 'user') { const unreadIds = data.filter(m => m.destinatario_id === profile.id && !m.lido).map(m => m.id); if (unreadIds.length > 0) await supabase.from('mensagens_chat').update({ lido: true }).in('id', unreadIds); } }
    };
    fetchMessages();
    const channel = supabase.channel(selectedRecipient.type === 'user' ? `chat-user-${[profile.id, selectedRecipient.data.id].sort().join('-')}` : `chat-group-${selectedRecipient.data.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens_chat' }, (payload: any) => { const msg = payload.new as Message; let isRelevant = selectedRecipient.type === 'user' ? (msg.remetente_id === profile.id && msg.destinatario_id === selectedRecipient.data.id) || (msg.remetente_id === selectedRecipient.data.id && msg.destinatario_id === profile.id) : msg.grupo_id === selectedRecipient.data.id; if (isRelevant) { if (msg.remetente_id !== profile.id && selectedRecipient.type === 'group') fetchMessages(); else if (msg.remetente_id !== profile.id || !messages.find(m => m.id === msg.id)) setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg as any]); if (selectedRecipient.type === 'user' && msg.destinatario_id === profile.id && !msg.lido) supabase.from('mensagens_chat').update({ lido: true }).eq('id', msg.id).then(); } }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedRecipient, profile?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, midiaUrl?: string) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !midiaUrl) return;
    const messageObj: any = { remetente_id: profile?.id, mensagem: newMessage.trim(), midia_url: midiaUrl || null };
    if (selectedRecipient?.type === 'user') messageObj.destinatario_id = selectedRecipient.data.id;
    else messageObj.grupo_id = selectedRecipient?.data.id;
    const { data, error } = await supabase.from('mensagens_chat').insert(messageObj).select('*, profiles(full_name)').single();
    if (!error && data) { setMessages(prev => [...prev, data as any]); setNewMessage(''); } else if (error) toast.error('Erro ao enviar mensagem');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setIsUploading(true);
    try {
      const filePath = `${profile.id}/${Math.random()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('chat-media').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      await handleSendMessage(undefined, publicUrl);
      toast.success('Mídia enviada!');
    } catch (error) { toast.error('Erro ao enviar arquivo'); } finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !profile?.id) return;
    const { data: group, error } = await supabase.from('chat_grupos').insert({ nome: groupName.trim(), criador_id: profile.id }).select().single();
    if (group && !error) {
      if (selectedGroupUsers.length > 0) await supabase.from('chat_grupo_membros').insert(selectedGroupUsers.map(userId => ({ grupo_id: group.id, perfil_id: userId, role: 'member' })));
      toast.success('Grupo criado com sucesso!');
      setGroupName(''); setSelectedGroupUsers([]); setIsCreatingGroup(false); fetchData(); setSelectedRecipient({ type: 'group', data: group });
    } else toast.error('Erro ao criar grupo.');
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'warning') => setConfirmation({ isOpen: true, title, message, onConfirm, type });
  const closeConfirmation = () => setConfirmation(prev => ({ ...prev, isOpen: false }));

  const executeDeleteGroup = async () => {
    if (!selectedRecipient || selectedRecipient.type !== 'group' || !isCreator) return;
    const groupId = selectedRecipient.data.id;
    setSelectedRecipient(null); setGroups(prev => prev.filter(g => g.id !== groupId)); closeConfirmation();
    const { error } = await supabase.from('chat_grupos').delete().eq('id', groupId);
    if (!error) toast.success('Grupo excluído'); else fetchData();
  };

  const executeRemoveMember = async (memberId: string) => {
    setCurrentGroupMembers(prev => prev.filter(m => m.id !== memberId)); closeConfirmation();
    const { error } = await supabase.from('chat_grupo_membros').delete().eq('id', memberId);
    if (!error) toast.success('Usuário removido'); else if (selectedRecipient?.type === 'group') fetchGroupMembers(selectedRecipient.data.id);
  };

  const executeLeaveGroup = async () => {
    const myMembership = currentGroupMembers.find(m => m.perfil_id === profile?.id);
    if (!myMembership) return;
    const groupId = selectedRecipient?.data?.id;
    setSelectedRecipient(null); if (groupId) setGroups(prev => prev.filter(g => g.id !== groupId)); closeConfirmation();
    const { error } = await supabase.from('chat_grupo_membros').delete().eq('id', myMembership.id);
    if (!error) toast.success('Você saiu do grupo'); else fetchData();
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (currentUserGroupRole !== 'admin') return;
    setCurrentGroupMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    const { error } = await supabase.from('chat_grupo_membros').update({ role: newRole }).eq('id', memberId);
    if (!error) toast.success(newRole === 'admin' ? 'Usuário promovido a Admin' : 'Cargo atualizado'); else if (selectedRecipient?.type === 'group') fetchGroupMembers(selectedRecipient.data.id);
  };

  const toggleUserSelection = (userId: string) => setSelectedGroupUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  
  const isImage = (url: string) => url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;

  const createRipple = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple-effect");
    const ripple = button.getElementsByClassName("ripple-effect")[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);
  };

  // Missing definitions that caused the error
  const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredGroups = groups.filter(g => g.nome.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div ref={containerRef} style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*,video/*,application/pdf" />

      {/* Floating Button */}
      <button onClick={() => setIsOpen(!isOpen)} style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'hsl(var(--primary))', color: 'white', border: 'none', boxShadow: '0 4px 15px hsla(var(--primary), 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} className="chat-toggle-btn">
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {unreadCount > 0 && !isOpen && <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', borderRadius: '50%', minWidth: '22px', height: '22px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{ position: 'absolute', bottom: '80px', right: 0, width: '380px', height: '550px', background: 'hsl(var(--bg-card))', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp 0.3s ease-out', border: '1px solid hsl(var(--border-light))' }}>
          
          {confirmation.isOpen && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                  <div style={{ background: 'hsl(var(--bg-card))', borderRadius: '12px', width: '100%', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                      <div style={{ marginBottom: '1rem', color: confirmation.type === 'danger' ? '#ef4444' : 'hsl(var(--primary))' }}><AlertTriangle size={40} style={{ margin: '0 auto' }} /></div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>{confirmation.title}</h4>
                      <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>{confirmation.message}</p>
                      <div style={{ display: 'flex', gap: '0.75rem' }}><button onClick={closeConfirmation} style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid hsl(var(--border-light))', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}>Não, cancelar</button><button onClick={confirmation.onConfirm} style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: 'none', background: confirmation.type === 'danger' ? '#ef4444' : 'hsl(var(--primary))', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Sim, confirmar</button></div>
                  </div>
              </div>
          )}

          <div style={{ padding: '1rem 1.25rem', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            {(selectedRecipient || isCreatingGroup) && (
              <button onClick={() => { if (isShowingMembers) setIsShowingMembers(false); else if (isCreatingGroup) setIsCreatingGroup(false); else setSelectedRecipient(null); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, zIndex: 2 }}><ChevronLeft size={24} /></button>
            )}
            <div 
                className={selectedRecipient?.type === 'group' ? 'group-header-info ripple-container' : ''}
                style={{ flex: 1, cursor: selectedRecipient?.type === 'group' ? 'pointer' : 'default', padding: '6px 10px', borderRadius: '12px', transition: 'all 0.3s ease-out', position: 'relative', overflow: 'hidden' }} 
                onClick={(e) => { if (selectedRecipient?.type === 'group') { createRipple(e); setTimeout(() => setIsShowingMembers(true), 150); } }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>{selectedRecipient ? (selectedRecipient.data as any).nome || (selectedRecipient.data as Profile).full_name : 'Chat Interno'}</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>{selectedRecipient ? (selectedRecipient.type === 'user' ? ((selectedRecipient.data as Profile).role === 'admin' ? 'Administrador' : (selectedRecipient.data as Profile).role === 'psicologo' ? 'Psicólogo' : 'Recepcionista') : `${currentGroupMembers.length} membros`) : 'Conversas internas e grupos'}</p>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', zIndex: 2 }}><X size={20} /></button>
          </div>

          {!selectedRecipient ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border-light))', background: 'hsl(var(--bg-card))' }}>
                <button onClick={() => setActiveTab('users')} style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 600, color: activeTab === 'users' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))', borderBottom: activeTab === 'users' ? '2px solid hsl(var(--primary))' : '2px solid transparent', cursor: 'pointer' }}>Usuários</button>
                <button onClick={() => setActiveTab('groups')} style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 600, color: activeTab === 'groups' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))', borderBottom: activeTab === 'groups' ? '2px solid hsl(var(--primary))' : '2px solid transparent', cursor: 'pointer' }}>Grupos</button>
              </div>
              {!isCreatingGroup && (
                <div style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border-light))' }}>
                  <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}><Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} /><input type="text" placeholder={activeTab === 'users' ? "Buscar usuários..." : "Buscar grupos..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.25rem', borderRadius: '8px', border: '1px solid hsl(var(--border-light))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', fontSize: '0.85rem', outline: 'none' }} /></div>
                    {activeTab === 'groups' && <button onClick={() => setIsCreatingGroup(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 0.75rem', borderRadius: '8px', border: 'none', background: 'hsl(var(--primary))', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}><Plus size={16} /> Novo</button>}
                  </div>
                </div>
              )}
              {isCreatingGroup ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', background: 'hsla(var(--primary), 0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><button onClick={() => setIsCreatingGroup(false)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}><ChevronLeft size={20} /></button><span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Criar Novo Grupo</span></div>
                    <div style={{ padding: '1rem' }}><label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '0.5rem', display: 'block' }}>NOME DO GRUPO</label><input autoFocus placeholder="Ex: Equipe de Quinta" value={groupName} onChange={(e) => setGroupName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid hsl(var(--border-light))', background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))', fontSize: '0.9rem', outline: 'none' }} /></div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }} className="custom-scrollbar"><label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '0.5rem', display: 'block' }}>SELECIONAR MEMBROS ({selectedGroupUsers.length + 1})</label><div style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', background: 'hsla(var(--primary), 0.1)', marginBottom: '2px', opacity: 0.8 }}><div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{profile?.full_name[0]}</div><div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Você (Criador)</span><span style={{ fontSize: '0.65rem', color: 'hsl(var(--primary))' }}>Administrador</span></div><Check size={16} color="hsl(var(--primary))" /></div>{users.map(user => (<div key={user.id} onClick={() => toggleUserSelection(user.id)} style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', borderRadius: '8px', background: selectedGroupUsers.includes(user.id) ? 'hsla(var(--primary), 0.1)' : 'transparent', marginBottom: '2px' }}><div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsl(var(--bg-main))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{user.full_name[0]}</div><span style={{ flex: 1, fontSize: '0.85rem' }}>{user.full_name}</span>{selectedGroupUsers.includes(user.id) && <Check size={16} color="hsl(var(--primary))" />}</div>))}</div>
                    <div style={{ padding: '1rem', borderTop: '1px solid hsl(var(--border-light))' }}><button disabled={!groupName.trim()} onClick={handleCreateGroup} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: groupName.trim() ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))', color: 'white', fontWeight: 700, cursor: groupName.trim() ? 'pointer' : 'default' }}>Criar Grupo</button></div>
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }} className="custom-scrollbar"> {activeTab === 'users' ? (filteredUsers.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>Nenhum usuário encontrado.</div> : filteredUsers.map(user => (<div key={user.id} onClick={() => setSelectedRecipient({ type: 'user', data: user })} style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', borderRadius: '12px' }} className="chat-item"><div translate="no" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{user.full_name[0]}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.full_name}</div><div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textTransform: 'capitalize' }}>{user.role}</div></div></div>))) : (filteredGroups.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>Nenhum grupo ainda.</div> : filteredGroups.map(group => (<div key={group.id} onClick={() => setSelectedRecipient({ type: 'group', data: group })} style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', borderRadius: '12px' }} className="chat-item"><div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{group.nome}</div><div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Grupo Interno</div></div></div>)))} </div>
              )}
            </div>
          ) : isShowingMembers ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideInRight 0.2s ease-out' }}>
                <div style={{ padding: '1rem', background: 'hsla(var(--primary), 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><button onClick={() => setIsShowingMembers(false)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}><ChevronLeft size={20} /></button><span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Integrantes</span></div></div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }} className="custom-scrollbar">
                    {currentGroupMembers.map(member => {
                        const isMe = member.perfil_id === profile?.id;
                        const isMemberCreator = member.perfil_id === (selectedRecipient.data as Group).criador_id;
                        return (<div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '12px', marginBottom: '2px' }} className="chat-item"><div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{member.profiles?.full_name[0]}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{member.profiles?.full_name} {isMe && '(Você)'}</div><div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>{member.role === 'admin' ? 'Administrador' : 'Membro'}</div></div> {currentUserGroupRole === 'admin' && !isMe && (<div style={{ display: 'flex', gap: '4px' }}> {member.role === 'member' && (<button onClick={() => handleUpdateMemberRole(member.id, 'admin')} style={{ padding: '5px', border: 'none', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', borderRadius: '5px', cursor: 'pointer' }} title="Promover a Admin"><Shield size={14} /></button>)} {!isMemberCreator && (<button onClick={() => showConfirmation('Remover Integrante', `Deseja remover ${member.profiles?.full_name} do grupo?`, () => executeRemoveMember(member.id), 'warning')} style={{ padding: '5px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '5px', cursor: 'pointer' }} title="Remover do grupo"><Trash2 size={14} /></button>)} </div>)} </div>);
                    })}
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid hsl(var(--border-light))', display: 'flex', gap: '0.5rem' }}>
                    {!isCreator && <button onClick={() => showConfirmation('Sair do Grupo', 'Deseja realmente sair deste grupo?', executeLeaveGroup, 'warning')} style={{ flex: 1, padding: '0.6rem', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><LogOut size={16} /> Sair do Grupo</button>}
                    {isCreator && <button onClick={() => showConfirmation('Excluir Grupo', 'Tem certeza que deseja excluir permanentemente este grupo?', executeDeleteGroup, 'danger')} style={{ flex: 1, padding: '0.6rem', border: 'none', background: '#ef4444', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Trash2 size={16} /> Excluir Grupo</button>}
                </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }} className="custom-scrollbar"> {messages.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>Nenhuma mensagem ainda.</div> : messages.map((msg, idx) => { const isMine = msg.remetente_id === profile?.id; return (<div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}> {selectedRecipient.type === 'group' && !isMine && <span style={{ fontSize: '0.65rem', color: 'hsl(var(--primary))', marginBottom: '2px', marginLeft: '4px', fontWeight: 600 }}>{msg.profiles?.full_name}</span>} <div style={{ maxWidth: '85%', padding: msg.midia_url && isImage(msg.midia_url) ? '0.25rem' : '0.65rem 0.85rem', borderRadius: isMine ? '14px 14px 0 14px' : '14px 14px 14px 0', background: isMine ? 'hsl(var(--primary))' : 'hsl(var(--bg-main))', color: isMine ? 'white' : 'hsl(var(--text-main))', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}> {msg.midia_url && <div style={{ marginBottom: msg.mensagem ? '0.5rem' : 0 }}> {isImage(msg.midia_url) ? <img src={msg.midia_url} alt="Mídia" style={{ width: '100%', borderRadius: '10px', display: 'block', cursor: 'pointer' }} onClick={() => window.open(msg.midia_url!, '_blank')} /> : <a href={msg.midia_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMine ? 'white' : 'hsl(var(--primary))', textDecoration: 'none', padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}><Paperclip size={18} /><span style={{ fontSize: '0.75rem' }}>Ver Arquivo</span></a>} </div>} {msg.mensagem} </div> <span style={{ fontSize: '0.6rem', color: 'hsl(var(--text-muted))', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '3px' }}>{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{isMine && selectedRecipient.type === 'user' && (msg.lido ? <Check size={10} color="hsl(var(--primary))" /> : <Check size={10} />)}</span> </div>); })} <div ref={messagesEndRef} /></div>
              <form onSubmit={handleSendMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid hsl(var(--border-light))', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '4px' }}> {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />} </button>
                <input type="text" placeholder="Digite sua mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '20px', border: '1px solid hsl(var(--border-light))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', outline: 'none', fontSize: '0.85rem' }} />
                <button type="submit" disabled={!newMessage.trim() && !isUploading} style={{ width: '38px', height: '38px', borderRadius: '50%', background: (newMessage.trim() || isUploading) ? 'hsl(var(--primary))' : 'hsla(var(--primary), 0.3)', color: 'white', border: 'none', cursor: (newMessage.trim() || isUploading) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={16} /></button>
              </form>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .chat-toggle-btn:hover { transform: scale(1.05); }
        .chat-item:hover { background-color: hsla(var(--primary), 0.05); }
        .group-header-info { position: relative; overflow: hidden; }
        .group-header-info:hover { background-color: rgba(255,255,255,0.15); animation: pulse-water 2s infinite; }
        .ripple-effect { position: absolute; background: rgba(255, 255, 255, 0.4); border-radius: 50%; transform: scale(0); animation: ripple-animation 0.6s linear; pointer-events: none; }
        @keyframes ripple-animation { to { transform: scale(4); opacity: 0; } }
        @keyframes pulse-water { 0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsla(var(--primary), 0.3); border-radius: 10px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
