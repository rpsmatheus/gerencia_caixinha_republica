/**
 * Componente ResidentCard
 * 
 * Exibe informações de um resident em formato de card moderno.
 * 
 */

import { Resident } from '../services/api';

interface ResidentCardProps {
  resident: Resident;
  onEdit?: (resident: Resident) => void;
  onDelete?: (id: string) => void;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
}

export function ResidentCard({
  resident,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: ResidentCardProps) {
  const joinDate = new Date(resident.joinDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="card card-hover card-interactive group h-full flex flex-col">
      {/* Header com Status */}
      <div className="flex-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">
            {resident.fullName}
          </h3>
          <p className="text-sm text-gray-500 mt-1">@{resident.nickname}</p>
        </div>
        <div className="ml-4">
          <span
            className={`badge ${
              resident.isActive
                ? 'badge-success'
                : 'badge-warning'
            }`}
          >
            {resident.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="divider my-4"></div>

      {/* Informações */}
      <div className="space-y-3 mb-6">
        {resident.whatsappNumber && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-lg">◆</span>
            <a
              href={`https://wa.me/${resident.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {resident.whatsappNumber}
            </a>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="text-lg">●</span>
          <span>Entrou em {joinDate}</span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col gap-2 mt-auto">
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(resident)}
              className="btn btn-sm btn-primary flex-1"
              title="Editar morador"
            >
              Editar
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                if (confirm(`Tem certeza que deseja deletar ${resident.fullName}?`)) {
                  onDelete(resident.id);
                }
              }}
              className="btn btn-sm btn-danger flex-1"
              title="Deletar morador"
            >
              Deletar
            </button>
          )}
        </div>

        {resident.isActive && onDeactivate && (
          <button
            onClick={() => onDeactivate(resident.id)}
            className="btn btn-sm btn-secondary w-full"
            title="Desativar morador"
          >
            Desativar
          </button>
        )}

        {!resident.isActive && onActivate && (
          <button
            onClick={() => onActivate(resident.id)}
            className="btn btn-sm btn-success w-full"
            title="Ativar morador"
          >
            Ativar
          </button>
        )}
      </div>
    </div>
  );
}
