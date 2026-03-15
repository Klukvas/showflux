import { render, screen } from '@testing-library/react';
import { Sidebar } from '../sidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockUseAuth = jest.fn();
jest.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders common nav items for all roles', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'agent' } });
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Showings')).toBeInTheDocument();
    expect(screen.getByText('Offers')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Team link for broker', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'broker' } });
    render(<Sidebar />);
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('hides Team link for agent', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'agent' } });
    render(<Sidebar />);
    expect(screen.queryByText('Team')).not.toBeInTheDocument();
  });

  it('renders ShowFlux branding', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'broker' } });
    render(<Sidebar />);
    expect(screen.getByText('ShowFlux')).toBeInTheDocument();
  });
});
