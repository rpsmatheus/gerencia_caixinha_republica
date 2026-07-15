import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { apiGetMock, apiPostMock, apiPutMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
  apiPutMock: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({
  default: {
    get: apiGetMock,
    post: apiPostMock,
    put: apiPutMock,
  },
}));

vi.mock('../../src/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canManageResidents: true,
  }),
}));

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    resident: {
      id: 'admin-1',
      role: 'admin',
    },
  }),
}));

const { default: Residents } = await import('../../src/pages/Residents');

const residentsResponse = {
  data: {
    data: [
      {
        id: 'resident-1',
        fullName: 'Joao Silva',
        nickname: 'joao',
        phone: '11999999999',
        category: 'Morador',
        isActive: true,
        createdAt: '2026-07-01T00:00:00.000Z',
      },
    ],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  apiGetMock.mockResolvedValue(residentsResponse);
});

describe('Residents page', () => {
  it('esconde busca e lista enquanto cria novo morador', async () => {
    const user = userEvent.setup();
    render(<Residents />);

    expect(await screen.findByLabelText('Buscar por nome ou apelido')).toBeInTheDocument();
    expect(await screen.findByText('Joao Silva')).toBeInTheDocument();

    await user.click(screen.getByTitle('Novo Morador'));

    expect(screen.getByRole('heading', { name: 'Novo Morador' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Buscar por nome ou apelido')).not.toBeInTheDocument();
    expect(screen.queryByText('Joao Silva')).not.toBeInTheDocument();
  });

  it('esconde busca e lista enquanto edita morador', async () => {
    const user = userEvent.setup();
    render(<Residents />);

    expect(await screen.findByLabelText('Buscar por nome ou apelido')).toBeInTheDocument();
    expect(await screen.findByText('Joao Silva')).toBeInTheDocument();

    await user.click(screen.getByTitle('Editar'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Editar Morador' })).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Buscar por nome ou apelido')).not.toBeInTheDocument();
    expect(screen.queryByText('Joao Silva')).not.toBeInTheDocument();
  });
});
