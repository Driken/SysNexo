import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Truck, Plus, Search, Edit2, Trash2, X, Save, Phone, Hash, Building2, MapPin, Globe, ChevronDown, ChevronUp, Map } from 'lucide-react';
import { toast } from 'sonner';

export const Fornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Accordion State
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);

  // Form State
  const [tipoInscricao, setTipoInscricao] = useState('PJ');
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [contato, setContato] = useState('');
  
  // Detailed Address State
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('');
  const [pais, setPais] = useState('Brasil');

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    const { data } = await supabase
      .from('fornecedores')
      .select('*')
      .order('razao_social', { ascending: true });
    if (data) setFornecedores(data);
  };

  const handleOpenModal = (fornecedor?: any) => {
    if (fornecedor) {
      setSelectedFornecedor(fornecedor);
      setTipoInscricao(fornecedor.tipo_inscricao || 'PJ');
      setCnpj(fornecedor.cnpj || '');
      setRazaoSocial(fornecedor.razao_social || fornecedor.nome || '');
      setNomeFantasia(fornecedor.nome_fantasia || '');
      setContato(fornecedor.contato || '');
      
      setCep(fornecedor.cep || '');
      setLogradouro(fornecedor.logradouro || fornecedor.endereco || '');
      setNumero(fornecedor.numero || '');
      setComplemento(fornecedor.complemento || '');
      setBairro(fornecedor.bairro || '');
      setMunicipio(fornecedor.municipio || '');
      setEstado(fornecedor.estado || '');
      setPais(fornecedor.pais || 'Brasil');
      
      setIsAddressExpanded(!!fornecedor.logradouro || !!fornecedor.endereco);
    } else {
      setSelectedFornecedor(null);
      setTipoInscricao('PJ');
      setCnpj('');
      setRazaoSocial('');
      setNomeFantasia('');
      setContato('');
      
      setCep('');
      setLogradouro('');
      setNumero('');
      setComplemento('');
      setBairro('');
      setMunicipio('');
      setEstado('');
      setPais('Brasil');
      
      setIsAddressExpanded(false);
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
          setIsAddressExpanded(true);
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
      const payload = { 
        tipo_inscricao: tipoInscricao,
        cnpj, 
        razao_social: razaoSocial,
        nome: razaoSocial,
        nome_fantasia: nomeFantasia,
        contato,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        municipio,
        estado,
        pais,
        endereco: `${logradouro}, ${numero}${complemento ? ' - ' + complemento : ''}` // Legacy compat
      };

      if (selectedFornecedor) {
        const { error } = await supabase
          .from('fornecedores')
          .update(payload)
          .eq('id', selectedFornecedor.id);
        if (error) throw error;
        toast.success('Fornecedor atualizado!');
      } else {
        const { error } = await supabase
          .from('fornecedores')
          .insert(payload);
        if (error) throw error;
        toast.success('Fornecedor cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      carregarFornecedores();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este fornecedor?')) {
      const { error } = await supabase.from('fornecedores').delete().eq('id', id);
      if (error) {
        toast.error(error.code === '23503' ? 'Não é possível excluir: existem despesas vinculadas.' : 'Erro ao excluir.');
      } else {
        toast.success('Fornecedor removido.');
        carregarFornecedores();
      }
    }
  };

  const filtered = fornecedores.filter(f => 
    (f.razao_social || f.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.cnpj && f.cnpj.includes(searchTerm))
  );

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="dashboard-title flex-row"><Truck size={28} /> Fornecedores</h1>
          <p className="text-muted">Parceiros e fornecedores oficiais da clínica.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ width: 'auto' }}><Plus size={18} /> Novo Fornecedor</button>
      </div>

      <div className="glass-card" style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Search size={18} style={{ marginLeft: '1rem', color: 'hsl(var(--primary))', opacity: 0.6 }} />
        <input type="text" placeholder="Buscar..." className="form-input" style={{ border: 'none', background: 'transparent', flex: 1 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'hsla(var(--primary), 0.05)', borderBottom: '1px solid hsl(var(--border-light))' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Fornecedor</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Documento</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Localização</th>
                <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid hsl(var(--border-light))' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 700 }}>{f.razao_social || f.nome}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{f.contato || 'N/I'}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'hsl(var(--text-muted))' }}>{f.cnpj || '---'}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                    {f.municipio ? `${f.municipio} - ${f.estado}` : f.endereco ? f.endereco.substring(0, 30) + '...' : '---'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenModal(f)} className="btn-icon"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(f.id)} className="btn-icon danger"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '800px', maxHeight: '95vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid hsl(var(--border-light))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsla(var(--primary), 0.05)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedFornecedor ? 'Ficha do Fornecedor' : 'Cadastrar Fornecedor'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '2rem' }}>
              {/* Seção 1: Dados Gerais */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'hsl(var(--primary))', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid hsla(var(--primary), 0.1)', paddingBottom: '0.5rem' }}>
                  <Building2 size={16} /> Informações Básicas
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div className="input-group">
                    <label className="input-label">Tipo de Inscrição</label>
                    <select className="form-input" value={tipoInscricao} onChange={e => setTipoInscricao(e.target.value)}>
                      <option value="PJ">Pessoa Jurídica</option>
                      <option value="PF">Pessoa Física</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{tipoInscricao === 'PJ' ? 'CNPJ' : 'CPF'}</label>
                    <input type="text" className="form-input" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Razão Social / Nome Completo</label>
                    <input type="text" required className="form-input" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Nome Fantasia</label>
                    <input type="text" className="form-input" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Contato Principal (E-mail/Tel)</label>
                    <input type="text" className="form-input" value={contato} onChange={e => setContato(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Seção 2: Endereço Clicável (Accordion) */}
              <div style={{ 
                border: '1px solid hsl(var(--border-light))', 
                borderRadius: '12px', 
                overflow: 'hidden',
                background: isAddressExpanded ? 'hsla(var(--primary), 0.02)' : 'transparent',
                transition: 'all 0.3s'
              }}>
                <button 
                  type="button"
                  onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                  style={{ 
                    width: '100%', padding: '1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MapPin size={18} color="hsl(var(--primary))" /> 
                    Endereço de Cobrança / Entrega
                    {!isAddressExpanded && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'hsl(var(--text-muted))', marginLeft: '1rem' }}>Clique para expandir e editar</span>}
                  </span>
                  {isAddressExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {isAddressExpanded && (
                  <div style={{ padding: '0 1.5rem 2rem 1.5rem', animation: 'slideIn 0.3s ease-out' }}>
                    <style>{`
                      @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                    `}</style>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                      <div className="input-group" style={{ gridColumn: 'span 1' }}>
                        <label className="input-label">CEP</label>
                        <input type="text" className="form-input" value={cep} onChange={e => fetchCep(e.target.value)} placeholder="00000-000" />
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
                      <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">País</label>
                        <input type="text" className="form-input" value={pais} onChange={e => setPais(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ width: 'auto' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: 'auto', minWidth: '180px' }}>
                  {loading ? 'Salvando...' : <span className="flex-row"><Save size={18} /> Salvar Fornecedor</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
