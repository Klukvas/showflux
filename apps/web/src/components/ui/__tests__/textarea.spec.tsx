import { render, screen } from '@testing-library/react';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  it('renders without label', () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders label and associates it with textarea', () => {
    render(<Textarea label="Notes" />);
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('has default rows of 4', () => {
    render(<Textarea label="Notes" />);
    expect(screen.getByLabelText('Notes')).toHaveAttribute('rows', '4');
  });

  it('shows error message', () => {
    render(<Textarea label="Notes" error="Too short" />);
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });

  it('sets aria-invalid when error present', () => {
    render(<Textarea label="Notes" error="Required" />);
    expect(screen.getByLabelText('Notes')).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies error styling', () => {
    render(<Textarea label="Notes" error="Required" />);
    expect(screen.getByLabelText('Notes')).toHaveClass('border-red-500');
  });
});
