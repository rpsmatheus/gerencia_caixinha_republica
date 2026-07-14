import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionButton from '../../src/components/ActionButton';

describe('ActionButton', () => {
  it('mostra apenas o emoji quando showText é falso (padrão)', () => {
    render(<ActionButton type="edit" />);
    const button = screen.getByTitle('Editar');
    expect(button).toHaveTextContent('✎');
    expect(button).not.toHaveTextContent('Editar');
  });

  it('mostra emoji e texto quando showText é verdadeiro', () => {
    render(<ActionButton type="delete" showText />);
    const button = screen.getByTitle('Deletar');
    expect(button).toHaveTextContent('✕');
    expect(button).toHaveTextContent('Deletar');
  });

  it('dispara onClick ao ser clicado', async () => {
    const onClick = vi.fn();
    render(<ActionButton type="add" onClick={onClick} />);

    await userEvent.click(screen.getByTitle('Adicionar'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('não dispara onClick quando disabled', async () => {
    const onClick = vi.fn();
    render(<ActionButton type="add" onClick={onClick} disabled />);

    const button = screen.getByTitle('Adicionar');
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('usa o title customizado quando informado', () => {
    render(<ActionButton type="attach" title="Anexar comprovante" />);
    expect(screen.getByTitle('Anexar comprovante')).toBeInTheDocument();
  });
});
