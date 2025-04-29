export type Race = 'human' | 'elf' | 'dwarf';
export type Job = 'warrior' | 'mage' | 'archer';
export type Alignment = 'cold' | 'order' | 'chaos';

export interface Card {
  id: number;
  race: Race;
  job: Job;
  alignment: Alignment;
  imagePath: string;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export interface BoardState {
  cards: (Card | null)[];
  selectedCards: Card[];
}

export interface ToastState {
  isVisible: boolean;
  type: 'success' | 'error';
  message: string;
}

export interface GameState {
  score: number;
  usedCardIds: number[];
} 