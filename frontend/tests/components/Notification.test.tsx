import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Notification from '../../src/components/Notification';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Notification', () => {
  it('renderiza a mensagem e o ícone de acordo com o tipo', () => {
    render(<Notification message="Salvo com sucesso" type="success" onClose={vi.fn()} />);

    expect(screen.getByText('Salvo com sucesso')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('chama onClose automaticamente após a duração informada', () => {
    const onClose = vi.fn();
    render(<Notification message="Erro ao salvar" type="error" onClose={onClose} duration={3000} />);

    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('usa 3000ms como duração padrão quando não informada', () => {
    const onClose = vi.fn();
    render(<Notification message="Aviso" type="info" onClose={onClose} />);

    vi.advanceTimersByTime(2999);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
