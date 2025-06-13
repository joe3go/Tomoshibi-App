
// Centralized asset management for build optimization
export const ASSETS = {
  // Chat background images
  CHAT_IMG_1: new URL('../assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png', import.meta.url).href,
  CHAT_IMG_2: new URL('../assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png', import.meta.url).href,
  
  // Background image
  CHERRY_BLOSSOM: new URL('../assets/cherry-blossom-background.jpg', import.meta.url).href,
} as const;

export type AssetKey = keyof typeof ASSETS;

// Asset preloader for performance
export const preloadAssets = (keys: AssetKey[]) => {
  keys.forEach(key => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = ASSETS[key];
    document.head.appendChild(link);
  });
};
