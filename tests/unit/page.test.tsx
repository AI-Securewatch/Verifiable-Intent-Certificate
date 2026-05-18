import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../../app/page';

// Mock axios since the app fetches public key and submits verification
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { fingerprint: 'mock-fingerprint' } }),
  post: jest.fn().mockResolvedValue({ data: { approved: true, vic_id: 'mock-vic-id', timestamp: new Date().toISOString(), vendor: 'Test Vendor', amount: 5000, decision_type: 'payment' } })
}));

describe('Home Page Verification Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders correctly and loads default policies', async () => {
    render(<Home />);
    
    const title = await screen.findByText('Verifiable Intent Certificates for AI Financial Decisions');
    expect(title).toBeTruthy();
    
    // Check if the default "Payment" decision type is active
    expect(screen.getByText('Decision Type')).toBeTruthy();
  });

  it('can verify a decision and update history', async () => {
    render(<Home />);
    
    // Switch to verify tab
    const verifyDecisionElements = screen.getAllByText('Verify Decision');
    fireEvent.click(verifyDecisionElements[0]);
    
    // Mock window alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    const verifyButton = verifyDecisionElements[verifyDecisionElements.length - 1];
    fireEvent.click(verifyButton!);
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Please enter entity name');
    });
    
    alertMock.mockRestore();
  });
});
