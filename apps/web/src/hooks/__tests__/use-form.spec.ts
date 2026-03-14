import { renderHook, act } from '@testing-library/react';
import { useForm } from '../use-form';

const initialValues = { name: '', email: '' };

function createHook(overrides: Record<string, unknown> = {}) {
  const onSubmit = jest.fn<Promise<void>, [Record<string, string>]>().mockResolvedValue(undefined);
  return renderHook(() =>
    useForm({
      initialValues,
      onSubmit,
      ...overrides,
    }),
  );
}

describe('useForm', () => {
  it('initialises with provided values', () => {
    const { result } = createHook();
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.serverError).toBeNull();
  });

  it('setValue updates the field value', () => {
    const { result } = createHook();
    act(() => result.current.setValue('name', 'Alice'));
    expect(result.current.values.name).toBe('Alice');
  });

  it('setValue clears field error and server error', () => {
    const { result } = createHook();
    act(() => result.current.setFieldError('name', 'required'));
    act(() => result.current.setServerError('server down'));
    expect(result.current.errors.name).toBe('required');
    expect(result.current.serverError).toBe('server down');

    act(() => result.current.setValue('name', 'Bob'));
    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.serverError).toBeNull();
  });

  it('handleBlur runs validator and sets error', () => {
    const validators = {
      name: (v: string) => (v.trim() ? null : 'Name is required'),
    };
    const { result } = createHook({ validators });

    act(() => result.current.handleBlur('name'));
    expect(result.current.errors.name).toBe('Name is required');
  });

  it('handleSubmit validates all fields and blocks on error', async () => {
    const onSubmit = jest.fn();
    const validators = {
      name: (v: string) => (v.trim() ? null : 'Name is required'),
    };
    const { result } = createHook({ validators, onSubmit });

    await act(() => result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent));
    expect(result.current.errors.name).toBe('Name is required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('handleSubmit calls onSubmit when validation passes', async () => {
    const onSubmit = jest.fn<Promise<void>, [Record<string, string>]>().mockResolvedValue(undefined);
    const { result } = createHook({ onSubmit });

    act(() => result.current.setValue('name', 'Alice'));
    act(() => result.current.setValue('email', 'a@b.com'));

    await act(() => result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice', email: 'a@b.com' });
  });

  it('handleSubmit catches onSubmit error and sets serverError', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Server error'));
    const { result } = createHook({ onSubmit });

    act(() => result.current.setValue('name', 'Alice'));
    act(() => result.current.setValue('email', 'a@b.com'));

    await act(() => result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent));
    expect(result.current.serverError).toBe('Server error');
  });

  it('isSubmitting lifecycle — false after submit completes', async () => {
    const submittedWhile: boolean[] = [];
    const onSubmit = jest.fn(async () => {
      // onSubmit is called synchronously inside handleSubmit after setIsSubmitting(true)
      // but React batches state updates, so we track via the mock
    });
    const { result } = createHook({ onSubmit });

    act(() => result.current.setValue('name', 'x'));

    await act(() =>
      result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent),
    );

    // After submit completes, isSubmitting should be false
    expect(result.current.isSubmitting).toBe(false);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('isSubmitting is set to false even when onSubmit rejects', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('fail'));
    const { result } = createHook({ onSubmit });

    act(() => result.current.setValue('name', 'x'));

    await act(() =>
      result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent),
    );

    expect(result.current.isSubmitting).toBe(false);
  });

  it('reset restores initial state', () => {
    const { result } = createHook();
    act(() => result.current.setValue('name', 'Alice'));
    act(() => result.current.setFieldError('email', 'bad'));
    act(() => result.current.setServerError('fail'));

    act(() => result.current.reset());
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.serverError).toBeNull();
  });

  it('setFieldError sets a specific field error', () => {
    const { result } = createHook();
    act(() => result.current.setFieldError('email', 'Invalid'));
    expect(result.current.errors.email).toBe('Invalid');
  });

  it('handleSubmit handles non-Error throws with fallback message', async () => {
    const onSubmit = jest.fn().mockRejectedValue('string error');
    const { result } = createHook({ onSubmit });

    act(() => result.current.setValue('name', 'x'));
    await act(() =>
      result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent),
    );

    expect(result.current.serverError).toBe('An unexpected error occurred');
  });
});
