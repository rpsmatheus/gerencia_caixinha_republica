import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResidentCard } from '../../src/components/ResidentCard';
import type { Resident } from '../../src/services/api';

function makeResident(overrides: Partial<Resident> = {}): Resident {
  return {
    id: 'r1',
    nickname: 'fulano',
    fullName: 'Fulano de Tal',
    whatsappNumber: '5511999999999',
    isActive: true,
    role: 'resident',
    joinDate: '2026-01-15T00:00:00.000Z',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ResidentCard', () => {
  it('exibe nome, apelido e status ativo', () => {
    render(<ResidentCard resident={makeResident()} />);

    expect(screen.getByText('Fulano de Tal')).toBeInTheDocument();
    expect(screen.getByText('@fulano')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('exibe status inativo quando o morador está desativado', () => {
    render(<ResidentCard resident={makeResident({ isActive: false })} />);
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('não renderiza botões de ação quando nenhum callback é passado', () => {
    render(<ResidentCard resident={makeResident()} />);
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    expect(screen.queryByText('Deletar')).not.toBeInTheDocument();
  });

  it('chama onEdit com o resident ao clicar em Editar', async () => {
    const onEdit = vi.fn();
    const resident = makeResident();
    render(<ResidentCard resident={resident} onEdit={onEdit} />);

    await userEvent.click(screen.getByText('Editar'));

    expect(onEdit).toHaveBeenCalledWith(resident);
  });

  it('chama onDelete com o id apenas após confirmação', async () => {
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ResidentCard resident={makeResident()} onDelete={onDelete} />);

    await userEvent.click(screen.getByText('Deletar'));

    expect(onDelete).toHaveBeenCalledWith('r1');
  });

  it('não chama onDelete quando a confirmação é cancelada', async () => {
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ResidentCard resident={makeResident()} onDelete={onDelete} />);

    await userEvent.click(screen.getByText('Deletar'));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('mostra o botão Desativar para morador ativo e Ativar para inativo', () => {
    const { rerender } = render(
      <ResidentCard resident={makeResident({ isActive: true })} onDeactivate={vi.fn()} onActivate={vi.fn()} />
    );
    expect(screen.getByText('Desativar')).toBeInTheDocument();
    expect(screen.queryByText('Ativar')).not.toBeInTheDocument();

    rerender(
      <ResidentCard resident={makeResident({ isActive: false })} onDeactivate={vi.fn()} onActivate={vi.fn()} />
    );
    expect(screen.getByText('Ativar')).toBeInTheDocument();
    expect(screen.queryByText('Desativar')).not.toBeInTheDocument();
  });
});
