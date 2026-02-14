
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const MAX_STORY_PAGES = 10;
export const BACK_COVER_PAGE = 11;
export const TOTAL_PAGES = 11;
export const INITIAL_PAGES = 2;
export const GATE_PAGE = 2;
export const BATCH_SIZE = 6;
export const DECISION_PAGES: number[] = []; // Linear story, no branching

export const TEXT_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (High Quality)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Faster)' }
];

export const IMAGE_MODELS = [
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (Best Quality)' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (Fast)' }
];

export const GENRES = [
  "Superhero",
  "Sci-Fi",
  "Fantasy",
  "Noir",
  "Cyberpunk",
  "Horror",
  "Western",
  "Manga Style"
];

export const TONES = [
  "Gritty",
  "Whimsical",
  "Epic",
  "Sarcastic",
  "Dark",
  "Inspiring"
];

export const LANGUAGES = [
  { name: "English", code: "en" },
  { name: "Spanish", code: "es" },
  { name: "French", code: "fr" },
  { name: "German", code: "de" },
  { name: "Japanese", code: "ja" },
  { name: "Korean", code: "ko" }
];

export type FaceStatus = 'idle' | 'scripting' | 'inking' | 'complete' | 'error';

export interface Beat {
  caption: string;
  dialogue?: string;
  scene: string;
  focus_char: 'hero' | 'friend' | 'other';
  choices?: string[];
}

export interface Persona {
  base64: string;
  name: string;
  desc: string;
}

export interface ComicFace {
  id: string;
  pageIndex: number;
  type: 'cover' | 'story' | 'back_cover';
  imageUrl?: string;
  narrative?: Beat;
  isLoading: boolean;
  status: FaceStatus;
  error?: boolean;
  choices: string[];
  resolvedChoice?: string;
  isDecisionPage?: boolean;
}
