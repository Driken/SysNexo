import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => void;
  viewMode: 'admin' | 'recepcao' | 'psicologo';
  setViewMode: (mode: 'admin' | 'recepcao' | 'psicologo') => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  updateProfile: () => {},
  viewMode: 'admin',
  setViewMode: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'admin' | 'recepcao' | 'psicologo'>('admin');

  // Mantém viewMode sincronizado com o role real se não for admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      setViewMode(profile.role);
    }
  }, [profile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!session) return;
    
    try {
      // Usar scope: 'local' evita erros 500 no Supabase quando a sessão global está instável
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    } finally {
      // Forçamos a limpeza completa do estado local para garantir que a UI reflita o logout
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const updateProfile = (data: Partial<Profile>) => {
    setProfile(prev => prev ? { ...prev, ...data } : prev);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, updateProfile, viewMode, setViewMode }}>
      {children}
    </AuthContext.Provider>
  );
};
