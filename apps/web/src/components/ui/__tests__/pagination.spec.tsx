import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../pagination';

describe('Pagination', () => {
  it('shows page info', () => {
    render(<Pagination total={50} page={1} limit={10} onPageChange={jest.fn()} />);
    expect(screen.getByText('Page 1 of 5 (50 total)')).toBeInTheDocument();
  });

  it('calls onPageChange when Next is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(<Pagination total={50} page={1} limit={10} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when Previous is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(<Pagination total={50} page={3} limit={10} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables Previous on first page', () => {
    render(<Pagination total={50} page={1} limit={10} onPageChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('disables Next on last page', () => {
    render(<Pagination total={50} page={5} limit={10} onPageChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('returns null when only one page', () => {
    const { container } = render(
      <Pagination total={5} page={1} limit={10} onPageChange={jest.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });
});
