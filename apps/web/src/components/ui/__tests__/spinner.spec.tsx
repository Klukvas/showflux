import { render } from '@testing-library/react';
import { Spinner } from '../spinner';

describe('Spinner', () => {
  it('renders svg element', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies md size by default', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveClass('h-6', 'w-6');
  });

  it.each([
    ['sm', 'h-4', 'w-4'],
    ['md', 'h-6', 'w-6'],
    ['lg', 'h-8', 'w-8'],
  ] as const)('applies %s size classes', (size, h, w) => {
    const { container } = render(<Spinner size={size} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass(h, w);
  });

  it('merges custom className', () => {
    const { container } = render(<Spinner className="text-blue-500" />);
    expect(container.querySelector('svg')).toHaveClass('text-blue-500');
  });

  it('has animate-spin class', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveClass('animate-spin');
  });
});
