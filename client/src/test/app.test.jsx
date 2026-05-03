import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import Login from '../pages/Login';

describe('ExerciseCard', () => {
  const sample = {
    name: 'Bench Press',
    sets: [{ weight: 225, reps: 5 }]
  };

  it('shows the exercise name', () => {
    render(<ExerciseCard exercise={sample} onChange={() => {}} onRemove={() => {}} />);
    expect(screen.getByDisplayValue('Bench Press')).toBeInTheDocument();
  });

  it('shows weight and reps', () => {
    render(<ExerciseCard exercise={sample} onChange={() => {}} onRemove={() => {}} />);
    expect(screen.getByDisplayValue('225')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('calls onRemove when x is clicked', () => {
    let called = false;
    render(
      <ExerciseCard
        exercise={sample}
        onChange={() => {}}
        onRemove={() => { called = true; }}
      />
    );
    fireEvent.click(screen.getByLabelText('Remove exercise'));
    expect(called).toBe(true);
  });

  it('adds a new set when + add set is clicked', () => {
    let updated = null;
    render(
      <ExerciseCard
        exercise={sample}
        onChange={(ex) => { updated = ex; }}
        onRemove={() => {}}
      />
    );
    fireEvent.click(screen.getByText('+ add set'));
    expect(updated.sets.length).toBe(2);
  });
});

describe('Login page', () => {
  it('renders email and password fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('shows error for invalid email', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'notvalid' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'something' }
    });
    fireEvent.click(screen.getByText('Log In'));
    // should show error
    const error = screen.getByText(/valid email/i);
    expect(error).toBeInTheDocument();
  });

  it('shows error if password is missing', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'good@email.com' }
    });
    fireEvent.click(screen.getByText('Log In'));
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
