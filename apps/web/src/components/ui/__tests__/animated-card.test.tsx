import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import AnimatedCard from '../animated-card';

describe('animated-card', () => {
  it('renders without crashing', () => {
    render(<AnimatedCard />);
    expect(screen.getByRole('main') || screen.getByTestId('animated-card')).toBeDefined();
  });

  it('renders with required props', () => {
    const props = {};
    render(<AnimatedCard {...props} />);
    expect(screen.getByRole('main') || screen.getByTestId('animated-card')).toBeDefined();
  });
});
