import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../components/register-form';

const mockRegister = jest.fn();
const mockPush = jest.fn();

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  usePathname: () => '/register',
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('../hooks/use-auth', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

jest.mock('@/lib/api-client', () => {
  class ApiClientError extends Error {
    statusCode: number;
    constructor(statusCode: number) {
      super('Conflict');
      this.statusCode = statusCode;
      this.name = 'ApiClientError';
    }
  }
  return { ApiClientError };
});

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Workspace Name')).toBeInTheDocument();
  });

  it('renders create account button', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('calls register and redirects on success', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterForm />);
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass1!');
    await user.type(screen.getByLabelText('Workspace Name'), 'My Brokerage');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(mockRegister).toHaveBeenCalledWith(
      'john@example.com',
      'StrongPass1!',
      'John Doe',
      'My Brokerage',
    );
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows email taken error on 409 conflict', async () => {
    const { ApiClientError } = jest.requireMock('@/lib/api-client');
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new ApiClientError(409));
    render(<RegisterForm />);
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'taken@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass1!');
    await user.type(screen.getByLabelText('Workspace Name'), 'My Brokerage');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('This email is already taken')).toBeInTheDocument();
  });

  it('calls onSuccess instead of router.push when provided', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass1!');
    await user.type(screen.getByLabelText('Workspace Name'), 'My Brokerage');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(onSuccess).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders without Card wrapper when embedded', () => {
    const { container } = render(<RegisterForm embedded />);
    expect(container.querySelector('form')).toBeInTheDocument();
  });

  it('shows switch-to-login button when callback provided', () => {
    const onSwitch = jest.fn();
    render(<RegisterForm onSwitchToLogin={onSwitch} />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
