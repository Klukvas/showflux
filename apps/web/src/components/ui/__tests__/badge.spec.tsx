import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it.each([
    ['default', 'bg-gray-100'],
    ['success', 'bg-green-100'],
    ['warning', 'bg-yellow-100'],
    ['danger', 'bg-red-100'],
    ['info', 'bg-blue-100'],
  ] as const)('applies %s variant class', (variant, expectedClass) => {
    render(<Badge variant={variant}>badge</Badge>);
    expect(screen.getByText('badge')).toHaveClass(expectedClass);
  });

  it('merges custom className', () => {
    render(<Badge className="ml-2">badge</Badge>);
    expect(screen.getByText('badge')).toHaveClass('ml-2');
  });
});
