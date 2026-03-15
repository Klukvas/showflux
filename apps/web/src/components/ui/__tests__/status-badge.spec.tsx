import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it.each([
    ['active', 'bg-green-100'],
    ['pending', 'bg-yellow-100'],
    ['sold', 'bg-blue-100'],
    ['withdrawn', 'bg-gray-100'],
    ['scheduled', 'bg-blue-100'],
    ['completed', 'bg-green-100'],
    ['cancelled', 'bg-gray-100'],
    ['no_show', 'bg-red-100'],
    ['submitted', 'bg-blue-100'],
    ['accepted', 'bg-green-100'],
    ['rejected', 'bg-red-100'],
    ['countered', 'bg-yellow-100'],
    ['expired', 'bg-gray-100'],
    ['revoked', 'bg-red-100'],
  ])('renders "%s" with correct variant class', (status, expectedClass) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status.replace(/_/g, ' '))).toHaveClass(expectedClass);
  });

  it('replaces underscores with spaces', () => {
    render(<StatusBadge status="no_show" />);
    expect(screen.getByText('no show')).toBeInTheDocument();
  });

  it('uses default variant for unknown status', () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText('unknown')).toHaveClass('bg-gray-100');
  });
});
