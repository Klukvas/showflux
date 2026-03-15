import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListingFiltersBar } from '../components/listing-filters';
import type { ListingFilters } from '@/types/listing';

describe('ListingFiltersBar', () => {
  const defaultFilters: ListingFilters = {};
  const onFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter inputs', () => {
    render(<ListingFiltersBar filters={defaultFilters} onFilterChange={onFilterChange} />);
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('Min Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Price')).toBeInTheDocument();
  });

  it('calls onFilterChange with page reset when status changes', async () => {
    const user = userEvent.setup();
    render(
      <ListingFiltersBar
        filters={{ page: 3 }}
        onFilterChange={onFilterChange}
      />,
    );
    await user.selectOptions(screen.getByLabelText('Status'), 'active');
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', page: 1 }),
    );
  });

  it('calls onFilterChange when city is typed', async () => {
    const user = userEvent.setup();
    render(<ListingFiltersBar filters={defaultFilters} onFilterChange={onFilterChange} />);
    await user.type(screen.getByLabelText('City'), 'Austin');
    expect(onFilterChange).toHaveBeenCalled();
    const lastCall = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1][0];
    expect(lastCall.page).toBe(1);
  });

  it('renders status options', () => {
    render(<ListingFiltersBar filters={defaultFilters} onFilterChange={onFilterChange} />);
    expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sold' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Withdrawn' })).toBeInTheDocument();
  });

  it('shows placeholder for status', () => {
    render(<ListingFiltersBar filters={defaultFilters} onFilterChange={onFilterChange} />);
    expect(screen.getByRole('option', { name: 'All statuses' })).toBeInTheDocument();
  });
});
