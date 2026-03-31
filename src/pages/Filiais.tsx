import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Plus, Search, Edit2, Trash2, X, Save, Phone, MapPin, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { toast } from 'sonner';

export const Filiais: React.FC = () => {
  const [filiais, setFiliais] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'filiais' | 'unidades'>('filiais');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddressExpanded, setIsAddressExpanded] = useState(true);

  // Form State
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [filialId, setFilialId] = useState('');

  useEffect(() => {
    carregarFiliais();
    carregarUnidades();
  }, []);

  const carregarFiliais = async () => {
    const { data } = await supabase
      .from('filiais')
      .select('*')
      .order('nome_fantasia', { ascending: true });
    if (data) setFiliais(data);
  };

  const carregarUnidades = async () => {
    const { data } = await supabase
      .from('unidades')
      .select('*, filiais(nome_fantasia)')
      .order('nome_unidade', { ascending: true });
    if (data) setUnidades(data);
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setSelectedItem(item);
      setNomeFantasia(activeTab === 'filiais' ? (item.nome_fantasia || '') : (item.nome_unidade || ''));
      setRazaoSocial(item.razao_social || '');
      setCnpj(item.cnpj || '');
      setCep(item.cep || '');
      setLogradouro(item.logradouro || '');
      setNumero(item.numero || '');
      setComplemento(item.complemento || '');
      setBairro(item.bairro || '');
      setMunicipio(item.municipio || '');
      setEstado(item.estado || '');
      setTelefone(item.telefone || '');
      setEmail(item.email || '');
      setFilialId(item.filial_id || '');
      setIsAddressExpanded(true);
    } else {
      setSelectedItem(null);
      setNomeFantasia('');
      setRazaoSocial('');
      setCnpj('');
      setCep('');
      setLogradouro('');
      setNumero('');
      setComplemento('');
      setBairro('');
      setMunicipio('');
      setEstado('');
      setTelefone('');
      setEmail('');
      setFilialId('');
      setIsAddressExpanded(true);
    }
    setIsModalOpen(true);
  };

  const fetchCep = async (valor: string) => {
    const cleanCep = valor.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setLogradouro(data.logradouro);
          setBairro(data.bairro);
          setMunicipio(data.localidade);
          setEstado(data.uf);
          toast.success('CEP Encontrado!');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP', err);
      }
    }
    setCep(valor);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isFilial = activeTab === 'filiais';
      const tableName = isFilial ? 'filiais' : 'unidades';
      
      const payload: any = { 
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        municipio,
        estado,
        telefone,
        email
      };

      if (isFilial) {
        payload.nome_fantasia = nomeFantasia;
        payload.razao_social = razaoSocial;
        payload.cnpj = cnpj;
      } else {
        payload.nome_unidade = nomeFantasia;
        payload.filial_id = filialId;
      }

      if (selectedItem) {
        const { error } = await supabase
          .from(tableName)
          .update(payload)
          .eq('id', selectedItem.id);
        if (error) throw error;
        toast.success(`${isFilial ? 'Filial' : 'Unidade'} atualizada!`);
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert(payload);
        if (error) throw error;
        toast.success(`${isFilial ? 'Filial' : 'Unidade'} cadastrada!`);
      }

      setIsModalOpen(false);
      carregarFiliais();
      carregarUnidades();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isFilial = activeTab === 'filiais';
    const tableName = isFilial ? 'filiais' : 'unidades';
    
    if (window.confirm(`Deseja realmente excluir esta ${isFilial ? 'filial' : 'unidade'}?`)) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) toast.error('Erro ao excluir: ' + error.message);
      else {
        if (isFilial) setFiliais(prev => prev.filter(f => f.id !== id));
        else setUnidades(prev => prev.filter(u => u.id !== id));
        toast.success(`${isFilial ? 'Filial' : 'Unidade'} removida.`);
      }
    }
  };

  const filteredFiliais = filiais.filter(f => 
    f.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj?.includes(searchTerm)
  );

  const filteredUnidades = unidades.filter(u => 
    u.nome_unidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.municipio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="dashboard-title flex-row">
            {activeTab === 'filiais' ? <Building2 size={28} /> : <MapPin size={28} />} 
            {activeTab === 'filiais' ? 'Filiais (Empresas)' : 'Unidades de Atendimento'}
          </h1>
          <p className="text-muted">
            {activeTab === 'filiais' ? 'Gerencie as empresas e filiais do seu grupo.' : 'Gerencie os pontos de atendimento vinculados às suas filiais.'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ width: 'auto' }}>
          <Plus size={18} /> {activeTab === 'filiais' ? 'Nova Filial' : 'Nova Unidade'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid hsl(var(--border-light))', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('filiais')}
          className={`btn ${activeTab === 'filiais' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ width: 'auto', background: activeTab === 'filiais' ? '' : 'transparent', border: activeTab === 'filiais' ? '' : 'none' }}
        >
          Filiais (Empresas)
        </button>
        <button 
          onClick={() => setActiveTab('unidades')}
          className={`btn ${activeTab === 'unidades' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ width: 'auto', background: activeTab === 'unidades' ? '' : 'transparent', border: activeTab === 'unidades' ? '' : 'none' }}
        >
          Unidades de Atendimento
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Search size={18} style={{ marginLeft: '1rem', color: 'hsl(var(--primary))', opacity: 0.6 }} />
        <input 
          type="text" 
          placeholder={`Buscar ${activeTab === 'filiais' ? 'filial' : 'unidade'}...`} 
          className="form-input" 
          style={{ border: 'none', background: 'transparent', flex: 1 }} 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </div>

      {activeTab === 'filiais' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredFiliais.map(f => (
            <div key={f.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '12px', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
                  <Building2 size={24} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleOpenModal(f)} className="btn-icon"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(f.id)} className="btn-icon danger"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{f.nome_fantasia}</h3>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>{f.cnpj || 'CNPJ não informado'}</p>
              
              <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-main))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><MapPin size={14} className="text-muted" /> {f.logradouro}, {f.numero}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: 0.8 }}>{f.bairro} - {f.municipio}/{f.estado}</div>
                {f.telefone && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}><Phone size={14} className="text-muted" /> {f.telefone}</div>}
                {f.email && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}><Mail size={14} className="text-muted" /> {f.email}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredUnidades.map(u => (
            <div key={u.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '12px', background: 'hsla(var(--secondary), 0.1)', color: 'hsl(var(--secondary))' }}>
                  <MapPin size={24} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleOpenModal(u)} className="btn-icon"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(u.id)} className="btn-icon danger"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{u.nome_unidade}</h3>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', fontWeight: 600, marginBottom: '1rem' }}>
                {u.filiais?.nome_fantasia || 'Sem filial vinculada'}
              </p>
              
              <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-main))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><MapPin size={14} className="text-muted" /> {u.logradouro}, {u.numero}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: 0.8 }}>{u.bairro} - {u.municipio}/{u.estado}</div>
                {u.telefone && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}><Phone size={14} className="text-muted" /> {u.telefone}</div>}
                {u.email && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}><Mail size={14} className="text-muted" /> {u.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid hsl(var(--border-light))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsla(var(--primary), 0.05)' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                {selectedItem ? `Editar ${activeTab === 'filiais' ? 'Filial' : 'Unidade'}` : `Nova ${activeTab === 'filiais' ? 'Filial' : 'Unidade'}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">
                    {activeTab === 'filiais' ? 'Nome Fantasia / Identificação da Filial' : 'Nome da Unidade de Atendimento'}
                  </label>
                  <input type="text" required className="form-input" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} />
                </div>
                {activeTab === 'filiais' ? (
                  <>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                      <label className="input-label">Razão Social</label>
                      <input type="text" className="form-input" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">CNPJ</label>
                      <input type="text" className="form-input" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                    </div>
                  </>
                ) : (
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Filial (Empresa Mãe)</label>
                    <select 
                      className="form-input" 
                      required 
                      value={filialId} 
                      onChange={e => setFilialId(e.target.value)}
                    >
                      <option value="">Selecione a filial...</option>
                      {filiais.map(f => (
                        <option key={f.id} value={f.id}>{f.nome_fantasia}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="input-group">
                  <label className="input-label">Telefone de Contato</label>
                  <input type="text" className="form-input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div className="input-group">
                  <label className="input-label">E-mail de Contato</label>
                  <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
              </div>

              <div style={{ border: '1px solid hsl(var(--border-light))', borderRadius: '12px', background: 'hsla(var(--primary), 0.02)' }}>
                <button 
                  type="button"
                  onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                  style={{ width: '100%', padding: '1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} color="hsl(var(--primary))" /> Endereço da Unidade
                  </span>
                  {isAddressExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {isAddressExpanded && (
                  <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                      <div className="input-group" style={{ gridColumn: 'span 1' }}>
                        <label className="input-label">CEP</label>
                        <input type="text" className="form-input" value={cep} onChange={e => fetchCep(e.target.value)} />
                      </div>
                      <div className="input-group" style={{ gridColumn: 'span 3' }}>
                        <label className="input-label">Logradouro / Rua</label>
                        <input type="text" className="form-input" value={logradouro} onChange={e => setLogradouro(e.target.value)} />
                      </div>
                      <div className="input-group" style={{ gridColumn: 'span 1' }}>
                        <label className="input-label">Número</label>
                        <input type="text" className="form-input" value={numero} onChange={e => setNumero(e.target.value)} />
                      </div>
                      <div className="input-group" style={{ gridColumn: 'span 3' }}>
                        <label className="input-label">Complemento</label>
                        <input type="text" className="form-input" value={complemento} onChange={e => setComplemento(e.target.value)} />
                      </div>
                      <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Bairro</label>
                        <input type="text" className="form-input" value={bairro} onChange={e => setBairro(e.target.value)} />
                      </div>
                      <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Cidade / Município</label>
                        <input type="text" className="form-input" value={municipio} onChange={e => setMunicipio(e.target.value)} />
                      </div>
                      <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Estado / UF</label>
                        <input type="text" className="form-input" value={estado} onChange={e => setEstado(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ width: 'auto' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: 'auto', minWidth: '180px' }}>
                  {loading ? 'Salvando...' : <span className="flex-row"><Save size={18} /> Salvar {activeTab === 'filiais' ? 'Filial' : 'Unidade'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
