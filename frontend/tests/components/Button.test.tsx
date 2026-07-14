import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../src/components/Button';

describe('Button', () => {
  it('renderiza o texto e dispara onClick ao ser clicado', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);

    const button = screen.getByRole('button', { name: 'Salvar' });
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fica desabilitado e não dispara onClick quando disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Salvar
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fica desabilitado enquanto loading, mesmo sem a prop disabled', () => {
    render(<Button loading>Salvar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renderiza o ícone quando informado', () => {
    render(<Button icon="★">Favoritar</Button>);
    expect(screen.getByText('★')).toBeInTheDocument();
    expect(screen.getByText('Favoritar')).toBeInTheDocument();
  });
});
