import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListingForm } from '../components/listing-form';
import type { Listing } from '@/types/listing';

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockToast = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), refresh: mockRefresh }),
}));

jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('@/lib/api-client', () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

describe('ListingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create mode by default', () => {
    render(<ListingForm />);
    expect(screen.getByRole('button', { name: 'Create Listing' })).toBeInTheDocument();
  });

  it('renders edit mode with pre-filled values', () => {
    const listing: Listing = {
      id: '1',
      workspaceId: 'w1',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      mlsNumber: 'MLS123',
      price: 500000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 2000,
      status: 'active',
      listingAgentId: 'a1',
      notes: 'Great house',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    render(<ListingForm listing={listing} />);
    expect(screen.getByRole('button', { name: 'Update Listing' })).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toHaveValue('123 Main St');
    expect(screen.getByLabelText('City')).toHaveValue('Austin');
  });

  it('renders all form fields', () => {
    render(<ListingForm />);
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('ZIP')).toBeInTheDocument();
    expect(screen.getByLabelText('Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<ListingForm />);
    await user.click(screen.getByRole('button', { name: 'Create Listing' }));
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('submits create form successfully', async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValue({ id: 'new-1' });
    render(<ListingForm />);

    await user.type(screen.getByLabelText('Address'), '456 Oak Ave');
    await user.type(screen.getByLabelText('City'), 'Dallas');
    await user.type(screen.getByLabelText('State'), 'TX');
    await user.type(screen.getByLabelText('ZIP'), '75001');
    await user.type(screen.getByLabelText('Price'), '350000');
    await user.click(screen.getByRole('button', { name: 'Create Listing' }));

    expect(mockPost).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith('Listing created', 'success');
    expect(mockPush).toHaveBeenCalledWith('/listings');
  });

  it('has cancel button', () => {
    render(<ListingForm />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
