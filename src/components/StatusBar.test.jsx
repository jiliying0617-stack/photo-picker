import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusBar from './StatusBar';
import usePhotoStore from '../store/usePhotoStore';

// Mock Zustand store
vi.mock('../store/usePhotoStore');

describe('StatusBar', () => {
  const mockGetStats = vi.fn();
  const mockPhotos = [];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    usePhotoStore.mockImplementation(selector => {
      const state = {
        getStats: mockGetStats,
        photos: mockPhotos,
      };
      return selector(state);
    });

    // Default stats
    mockGetStats.mockReturnValue({
      total: 100,
      correct: 50,
      medium: 30,
      wrong: 20,
    });
  });

  it('should render null when no photos', () => {
    mockGetStats.mockReturnValue({
      total: 0,
      correct: 0,
      medium: 0,
      wrong: 0,
    });

    const { container } = render(<StatusBar />);

    expect(container.firstChild).toBeNull();
  });

  it('should display correct stats', () => {
    render(<StatusBar />);

    expect(screen.getByText('100')).toBeInTheDocument(); // total
    expect(screen.getByText('50')).toBeInTheDocument(); // correct
    expect(screen.getByText('30')).toBeInTheDocument(); // medium
    expect(screen.getByText('20')).toBeInTheDocument(); // wrong
  });

  it('should calculate percentages correctly', () => {
    render(<StatusBar />);

    expect(screen.getByText('50%')).toBeInTheDocument(); // correct
    expect(screen.getByText('30%')).toBeInTheDocument(); // medium
    expect(screen.getByText('20%')).toBeInTheDocument(); // wrong
  });

  it('should handle zero total gracefully', () => {
    mockGetStats.mockReturnValue({
      total: 0,
      correct: 0,
      medium: 0,
      wrong: 0,
    });

    const { container } = render(<StatusBar />);

    // Should render nothing when total is 0
    expect(container.firstChild).toBeNull();
  });

  it('should show group navigation when enabled', () => {
    render(<StatusBar enableGroupNavigation={true} totalGroups={10} />);

    expect(screen.getByText(/共 10 组/)).toBeInTheDocument();
    expect(screen.getByText('首组')).toBeInTheDocument();
    expect(screen.getByText('末组')).toBeInTheDocument();
    expect(screen.getByText('GO')).toBeInTheDocument();
  });

  it('should not show group navigation when disabled', () => {
    render(<StatusBar enableGroupNavigation={false} totalGroups={10} />);

    expect(screen.queryByText(/共 10 组/)).not.toBeInTheDocument();
    expect(screen.queryByText('首组')).not.toBeInTheDocument();
  });

  it('should show compare mode indicator', () => {
    render(<StatusBar isCompareMode={true} enableGroupNavigation={true} totalGroups={5} />);

    expect(screen.getByText('(对比)')).toBeInTheDocument();
  });

  it('should call onJumpToGroup when clicking 首组', () => {
    const onJumpToGroup = vi.fn();

    render(<StatusBar enableGroupNavigation={true} totalGroups={10} onJumpToGroup={onJumpToGroup} />);

    fireEvent.click(screen.getByText('首组'));

    expect(onJumpToGroup).toHaveBeenCalledWith(0);
  });

  it('should call onJumpToGroup when clicking 末组', () => {
    const onJumpToGroup = vi.fn();

    render(<StatusBar enableGroupNavigation={true} totalGroups={10} onJumpToGroup={onJumpToGroup} />);

    fireEvent.click(screen.getByText('末组'));

    expect(onJumpToGroup).toHaveBeenCalledWith(9); // totalGroups - 1
  });

  it('should handle input change for jump to group', () => {
    const onJumpToGroupChange = vi.fn();

    render(
      <StatusBar
        enableGroupNavigation={true}
        totalGroups={10}
        onJumpToGroupChange={onJumpToGroupChange}
      />
    );

    const input = screen.getByPlaceholderText('#');
    fireEvent.change(input, { target: { value: '5' } });

    expect(onJumpToGroupChange).toHaveBeenCalledWith('5');
  });

  it('should call onJumpToGroup with correct index when clicking GO', () => {
    const onJumpToGroup = vi.fn();
    const onJumpToGroupChange = vi.fn();

    render(
      <StatusBar
        enableGroupNavigation={true}
        totalGroups={10}
        jumpToGroup="5"
        onJumpToGroup={onJumpToGroup}
        onJumpToGroupChange={onJumpToGroupChange}
      />
    );

    fireEvent.click(screen.getByText('GO'));

    expect(onJumpToGroup).toHaveBeenCalledWith(4); // 5 - 1 (0-indexed)
    expect(onJumpToGroupChange).toHaveBeenCalledWith(''); // Clear input
  });

  it('should call onJumpToGroup when pressing Enter in input', async () => {
    const onJumpToGroup = vi.fn();
    const user = userEvent.setup();

    render(
      <StatusBar
        enableGroupNavigation={true}
        totalGroups={10}
        jumpToGroup="3"
        onJumpToGroup={onJumpToGroup}
      />
    );

    const input = screen.getByPlaceholderText('#');
    await user.type(input, '{Enter}');

    expect(onJumpToGroup).toHaveBeenCalledWith(2); // 3 - 1
  });

  it('should disable GO button when input is invalid', () => {
    render(<StatusBar enableGroupNavigation={true} totalGroups={10} jumpToGroup="" />);

    const goButton = screen.getByText('GO');
    expect(goButton).toBeDisabled();
  });

  it('should disable GO button when input is out of range', () => {
    render(<StatusBar enableGroupNavigation={true} totalGroups={10} jumpToGroup="15" />);

    const goButton = screen.getByText('GO');
    expect(goButton).toBeDisabled();
  });

  it('should show warning when photos missing files', () => {
    usePhotoStore.mockImplementation(selector => {
      const state = {
        getStats: mockGetStats,
        photos: [{ id: '1' }, { id: '2', file: {} }, { id: '3' }], // 2 photos without file
      };
      return selector(state);
    });

    render(<StatusBar />);

    expect(screen.getByText(/2 张图片缺少文件/)).toBeInTheDocument();
    expect(screen.getByText('需要重新导入文件夹才能导出')).toBeInTheDocument();
  });

  it('should show keyboard shortcuts when no warnings', () => {
    usePhotoStore.mockImplementation(selector => {
      const state = {
        getStats: mockGetStats,
        photos: [{ id: '1', file: {} }, { id: '2', file: {} }], // All photos have files
      };
      return selector(state);
    });

    render(<StatusBar />);

    expect(screen.getByText('⚡ 极速模式')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display version number', () => {
    usePhotoStore.mockImplementation(selector => {
      const state = {
        getStats: mockGetStats,
        photos: [{ id: '1', file: {} }],
      };
      return selector(state);
    });

    render(<StatusBar />);

    expect(screen.getByText('v1.2.0')).toBeInTheDocument();
  });
});
