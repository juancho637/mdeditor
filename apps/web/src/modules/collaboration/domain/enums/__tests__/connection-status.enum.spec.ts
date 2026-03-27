import { ConnectionStatus } from '../connection-status.enum';

describe('ConnectionStatus enum', () => {
  it('should have all expected values', () => {
    expect(ConnectionStatus.CONNECTED).toBe('connected');
    expect(ConnectionStatus.DISCONNECTED).toBe('disconnected');
    expect(ConnectionStatus.RECONNECTING).toBe('reconnecting');
    expect(ConnectionStatus.OFFLINE).toBe('offline');
  });

  it('should have exactly 4 values', () => {
    const values = Object.values(ConnectionStatus);
    expect(values).toHaveLength(4);
  });
});
