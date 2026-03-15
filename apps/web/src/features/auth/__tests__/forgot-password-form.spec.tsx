import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from '../components/forgot-password-form';

const mockPost = jest.fn();

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('@/lib/api-client', () => ({
  api: { post: (...args: unknown[]) => mockPost(...args) },
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email field and submit button', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('shows instructional text', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByText(/Enter your email/)).toBeInTheDocument();
  });

  it('submits and shows success message', async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValue(undefined);
    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    expect(mockPost).toHaveBeenCalled();
    expect(screen.getByText('Check your email')).toBeInTheDocument();
    expect(screen.getByText(/password reset link/)).toBeInTheDocument();
  });

  it('shows back to sign in link', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByText('Back to sign in')).toBeInTheDocument();
  });
});
