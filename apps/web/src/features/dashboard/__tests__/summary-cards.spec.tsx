import { render, screen } from '@testing-library/react';
import { SummaryCards } from '../components/summary-cards';
import type { DashboardSummary } from '@/types/dashboard';

const mockData: DashboardSummary = {
  listings: { total: 25, active: 15, pending: 5, sold: 5 },
  showings: { total: 40, scheduled: 10, completed: 30 },
  offers: { total: 12, submitted: 4, accepted: 8 },
  team: { total: 6, active: 5 },
};

describe('SummaryCards', () => {
  it('shows loading skeletons', () => {
    const { container } = render(<SummaryCards data={null} isLoading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders data values', () => {
    render(<SummaryCards data={mockData} isLoading={false} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('renders card titles', () => {
    render(<SummaryCards data={mockData} isLoading={false} />);
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Showings')).toBeInTheDocument();
    expect(screen.getByText('Offers')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('renders subtitles with breakdown', () => {
    render(<SummaryCards data={mockData} isLoading={false} />);
    expect(screen.getByText('15 active, 5 pending')).toBeInTheDocument();
    expect(screen.getByText('10 scheduled, 30 completed')).toBeInTheDocument();
    expect(screen.getByText('4 submitted, 8 accepted')).toBeInTheDocument();
    expect(screen.getByText('5 active members')).toBeInTheDocument();
  });

  it('returns null when not loading and data is null', () => {
    const { container } = render(<SummaryCards data={null} isLoading={false} />);
    expect(container.innerHTML).toBe('');
  });
});
