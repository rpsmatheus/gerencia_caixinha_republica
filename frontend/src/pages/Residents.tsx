/**
 * Página de Moradores
 */

import { useState, useEffect } from 'react';
import api from '../services/api';
import ActionButton from '../components/ActionButton';
import Notification from '../components/Notification';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';

interface Resident {
  id: string;
  fullName: string;
  nickname: string;
  phone: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface FormData {
  fullName: string;
  nickname: string;
  phone: string;
  category: string;
}

const CATEGORIES = ['Bixo', 'Agregado', 'Morador'];

export default function Residents() {
  const { canManageResidents } = usePermissions();
  const { resident: currentUser } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    nickname: '',
    phone: '',
    category: 'Bixo',
  });

  useEffect(() => {
    loadResidents();
  }, []);

  // BUG FIX: Usar limit=1000 para garantir que todos os moradores sejam retornados,
  // evitando que novos moradores fiquem invisíveis por causa da paginação padrão (limit=10).
  const loadResidents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/residents', {
        params: { limit: 1000, page: 1 },
      });
      // A API retorna { success, data, pagination }
      const data = res.data?.data ?? res.data;
      setResidents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar moradores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.nickname) {
      setError('Nome completo e apelido são obrigatórios');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/residents/${editingId}`, {
          fullName: formData.fullName,
          nickname: formData.nickname,
          phone: formData.phone || null,
          category: formData.category,
        });
        setSuccess('Morador atualizado!');
      } else {
        await api.post('/api/residents', {
          fullName: formData.fullName,
          nickname: formData.nickname,
          phone: formData.phone || null,
          category: formData.category,
        });
        setSuccess('Morador criado!');
      }

      setFormData({ fullName: '', nickname: '', phone: '', category: 'Bixo' });
      setEditingId(null);
      setShowForm(false);
      // Recarregar lista após criação/edição
      await loadResidents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar morador');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEdit = (resident: Resident) => {
    setEditingId(resident.id);
    setFormData({
      fullName: resident.fullName,
      nickname: resident.nickname,
      phone: resident.phone || '',
      category: resident.category,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ fullName: '', nickname: '', phone: '', category: 'Bixo' });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      setError('Não é possível remover o seu próprio perfil.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!confirm('Tem certeza que deseja remover este morador?')) return;
    try {
      await api.delete(`/api/residents/${id}`);
      setSuccess('Morador removido!');
      await loadResidents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao remover morador');
      setTimeout(() => setError(null), 3000);
    }
  };

  const bgClass = 'bg-white';
  const textClass = 'text-gray-900';
  const borderClass = 'border-gray-200';
  const inputClass = 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`text-3xl font-bold ${textClass}`}>Moradores</h1>
          <p className="text-gray-600 mt-2">Gerenciar moradores da caixinha</p>
        </div>
        {!showForm && canManageResidents && (
          <ActionButton type="add" onClick={() => setShowForm(true)} title="Novo Morador" />
        )}
      </div>

      {error && <Notification type="error" message={error} onClose={() => setError(null)} />}
      {success && <Notification type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Form Modal */}
      {showForm && (
        <div className={`${bgClass} p-6 rounded-lg shadow-sm border ${borderClass} space-y-4`}>
          <h2 className={`text-lg font-semibold ${textClass}`}>
            {editingId ? 'Editar Morador' : 'Novo Morador'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${textClass} mb-2`}>
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                placeholder="Ex: João Silva"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${textClass} mb-2`}>
                Apelido *
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                placeholder="Ex: João"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${textClass} mb-2`}>
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                placeholder="Ex: 11999999999"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${textClass} mb-2`}>
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingId ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={`${bgClass} p-8 rounded-lg shadow-sm text-center border ${borderClass}`}>
          <p className="text-gray-600">Carregando moradores...</p>
        </div>
      )}

      {/* Residents Grid */}
      {!loading && residents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {residents.map(resident => (
            <div key={resident.id} className={`${bgClass} p-6 rounded-lg shadow-sm border ${borderClass} hover:shadow-md transition-shadow`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className={`font-bold ${textClass} text-lg truncate`}>{resident.fullName}</h3>
                  <p className="text-sm text-gray-600 truncate">@{resident.nickname}</p>
                </div>
                <span 
                  className="px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2"
                >
                  {resident.category}
                </span>
              </div>

              {resident.phone && (
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium text-gray-700">Telefone:</span> {resident.phone}
                </p>
              )}
              {!resident.phone && (
                <p className="text-sm text-gray-400 mb-4">
                  <span className="font-medium text-gray-500">Telefone:</span> Não informado
                </p>
              )}

              <div className="flex gap-2">
              {(canManageResidents || currentUser?.id === resident.id) && (
                <ActionButton type="edit" onClick={() => handleEdit(resident)} className="flex-1" />
              )}
              {canManageResidents && resident.id !== currentUser?.id && (
                <ActionButton type="delete" onClick={() => handleDelete(resident.id)} />
              )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && residents.length === 0 && (
        <div className={`${bgClass} p-12 rounded-lg shadow-sm text-center border ${borderClass}`}>
          <div className="text-4xl mb-4 text-indigo-600">◆</div>
          <h3 className={`text-lg font-semibold ${textClass}`}>Nenhum morador registrado</h3>
          <p className="text-gray-600">Comece adicionando um novo morador</p>
        </div>
      )}
    </div>
  );
}
