declare global {
  interface Window {
    DOCUMIND_API_BASE?: string;
  }
}

// Overridable at deploy time (GitHub Pages injects window.DOCUMIND_API_BASE in index.html).
export const API_BASE = window.DOCUMIND_API_BASE ?? 'http://localhost:3000';
