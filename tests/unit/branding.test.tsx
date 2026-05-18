import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../../app/page';

describe('Branding and UI Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies that the deep-tech forensic aesthetic components are rendered', () => {
    const { container } = render(<Home />);
    
    // Check for the global brand preloader
    const preloader = container.querySelector('#global-brand-preloader');
    expect(preloader).toBeInTheDocument();
    
    // Check for glassmorphism panels
    const glassPanels = container.querySelectorAll('.glass-panel');
    expect(glassPanels.length).toBeGreaterThan(0);
    
    // Check for dark mode background aesthetic class
    const background = container.querySelector('.bg-transparent');
    expect(background).toBeInTheDocument();
  });
});
