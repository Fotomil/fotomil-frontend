import { create } from 'zustand';

interface ViewerState {
  currentIndex: number;
  rotation: number;
  isFullscreen: boolean;
  isViewerOpen: boolean;

  setCurrentIndex: (index: number) => void;
  setRotation: (rotation: number) => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  resetRotation: () => void;
  toggleFullscreen: () => void;
  openViewer: (index: number) => void;
  closeViewer: () => void;
  next: (total: number) => void;
  previous: () => void;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  currentIndex: 0,
  rotation: 0,
  isFullscreen: false,
  isViewerOpen: false,

  setCurrentIndex: (index) => set({ currentIndex: index, rotation: 0 }),
  setRotation: (rotation) => set({ rotation }),
  rotateLeft: () => set((s) => ({ rotation: (s.rotation - 90 + 360) % 360 })),
  rotateRight: () => set((s) => ({ rotation: (s.rotation + 90) % 360 })),
  resetRotation: () => set({ rotation: 0 }),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
  openViewer: (index) => set({ isViewerOpen: true, currentIndex: index, rotation: 0 }),
  closeViewer: () => set({ isViewerOpen: false, isFullscreen: false, rotation: 0 }),

  next: (total) => {
    const { currentIndex } = get();
    if (currentIndex < total - 1) {
      set({ currentIndex: currentIndex + 1, rotation: 0 });
    }
  },
  previous: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, rotation: 0 });
    }
  },
}));
