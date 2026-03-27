import { getColorForUser } from '../cursor-colors';

describe('getColorForUser', () => {
  it('should return consistent color for the same userId', () => {
    const color1 = getColorForUser('user-123');
    const color2 = getColorForUser('user-123');
    expect(color1).toEqual(color2);
  });

  it('should return different colors for different userIds', () => {
    const colors = new Set<string>();
    const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'];
    for (const id of userIds) {
      colors.add(getColorForUser(id).light);
    }
    // With 8 users and 8 colors, we expect good distribution (at least 4 unique)
    expect(colors.size).toBeGreaterThanOrEqual(4);
  });

  it('should return an object with light and dark hex colors', () => {
    const color = getColorForUser('test-user');
    expect(color).toHaveProperty('light');
    expect(color).toHaveProperty('dark');
    expect(color.light).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(color.dark).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
