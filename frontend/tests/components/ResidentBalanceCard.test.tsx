import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import ResidentBalanceCard from '../../src/components/ResidentBalanceCard';

function renderCard(overrides: Partial<ComponentProps<typeof ResidentBalanceCard>> = {}) {
  return render(
    <ResidentBalanceCard
      residentName="Joao Silva"
      nickname="joao"
      isActive={true}
      exitDay={15}
      proportionalFactor={0.5}
      previousBalance={0}
      currentMonthDue={50}
      totalDue={50}
      totalPaid={0}
      remainingBalance={50}
      payments={[]}
      darkMode={false}
      {...overrides}
    />
  );
}

describe('ResidentBalanceCard', () => {
  it('chama onSetProportional com null ao remover cálculo proporcional', async () => {
    const user = userEvent.setup();
    const onSetProportional = vi.fn();

    renderCard({ onSetProportional });

    await user.click(screen.getByTitle('Definir cálculo proporcional por dias de permanência no mês'));
    await user.click(screen.getByRole('button', { name: 'Remover' }));

    expect(onSetProportional).toHaveBeenCalledWith(null);
  });
});
