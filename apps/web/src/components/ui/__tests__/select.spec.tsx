import { render, screen } from '@testing-library/react';
import { Select } from '../select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

describe('Select', () => {
  it('renders options', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument();
  });

  it('renders label and associates it with select', () => {
    render(<Select label="Status" options={options} />);
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('generates id from label', () => {
    render(<Select label="My Status" options={options} />);
    expect(screen.getByLabelText('My Status')).toHaveAttribute('id', 'my-status');
  });

  it('renders placeholder option', () => {
    render(<Select options={options} placeholder="Choose one" />);
    expect(screen.getByRole('option', { name: 'Choose one' })).toHaveValue('');
  });

  it('shows error message', () => {
    render(<Select options={options} label="Status" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('sets aria-invalid when error present', () => {
    render(<Select options={options} label="Status" error="Required" />);
    expect(screen.getByLabelText('Status')).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies error styling', () => {
    render(<Select options={options} label="Status" error="Required" />);
    expect(screen.getByLabelText('Status')).toHaveClass('border-red-500');
  });
});
