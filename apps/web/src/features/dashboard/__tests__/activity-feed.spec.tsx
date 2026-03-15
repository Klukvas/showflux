import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '../components/activity-feed';
import type { PaginatedResponse } from '@/types/common';
import type { Activity } from '@/types/activity';

jest.mock('../components/activity-item', () => ({
  ActivityItem: ({ activity }: { activity: Activity }) => (
    <div data-testid="activity-item">{activity.action}</div>
  ),
}));

const mockActivities: PaginatedResponse<Activity> = {
  data: [
    {
      id: '1',
      workspaceId: 'w1',
      userId: 'u1',
      action: 'listing_created',
      entityType: 'listing',
      entityId: 'l1',
      metadata: null,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      workspaceId: 'w1',
      userId: 'u1',
      action: 'offer_submitted',
      entityType: 'offer',
      entityId: 'o1',
      metadata: null,
      createdAt: '2024-01-02T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
};

describe('ActivityFeed', () => {
  it('shows loading skeletons', () => {
    const { container } = render(<ActivityFeed data={null} isLoading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders activity items', () => {
    render(<ActivityFeed data={mockActivities} isLoading={false} />);
    const items = screen.getAllByTestId('activity-item');
    expect(items).toHaveLength(2);
    expect(screen.getByText('listing_created')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    const emptyData: PaginatedResponse<Activity> = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    };
    render(<ActivityFeed data={emptyData} isLoading={false} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('shows empty state when data is null', () => {
    render(<ActivityFeed data={null} isLoading={false} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders header title', () => {
    render(<ActivityFeed data={mockActivities} isLoading={false} />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});
