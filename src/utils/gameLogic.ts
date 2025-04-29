import { Card, ValidationResult, Race, Job, Alignment } from '../types/types';

// 카드 속성 비교 함수
export const compareAttributes = (cards: Card[]): ValidationResult => {
  if (cards.length !== 3) {
    return {
      isValid: false,
      message: '3개의 카드가 필요합니다.'
    };
  }

  const attributes: (keyof Omit<Card, 'id' | 'imagePath'>)[] = ['race', 'job', 'alignment'];
  
  let isValidCombination = true;
  for (const attr of attributes) {
    const values = [cards[0][attr], cards[1][attr], cards[2][attr]];
    const allSame = values.every(v => v === values[0]);
    const allDifferent = new Set(values).size === values.length;
    
    if (!allSame && !allDifferent) {
      isValidCombination = false;
      break;
    }
  }

  return {
    isValid: isValidCombination,
    message: isValidCombination ? '유효한 조합입니다!' : '유효하지 않은 조합입니다.'
  };
};

// 카드 ID로부터 속성 결정
export const getCardAttributes = (id: number): { race: Race; job: Job; alignment: Alignment } => {
  // 종족 결정
  let race: Race;
  if ([1,2,3,10,11,12,19,20,21].includes(id)) {
    race = 'human';
  } else if ([4,5,6,13,14,15,22,23,24].includes(id)) {
    race = 'elf';
  } else {
    race = 'dwarf';
  }

  // 직업 결정
  let job: Job;
  if (id <= 9) {
    job = 'mage';
  } else if (id <= 18) {
    job = 'archer';
  } else {
    job = 'warrior';
  }

  // 성향 결정
  let alignment: Alignment;
  if ([1,4,7,10,13,16,19,22,25].includes(id)) {
    alignment = 'cold';
  } else if ([2,5,8,11,14,17,20,23,26].includes(id)) {
    alignment = 'order';
  } else {
    alignment = 'chaos';
  }

  return { race, job, alignment };
};

// 카드 생성 함수
export const createCard = (id: number): Card => {
  const attributes = getCardAttributes(id);
  
  // 이미지 경로 설정 - 1자리 숫자는 01, 09 형식으로 변환
  let imagePath;
  if (id < 10) {
    imagePath = `/Assets/0${id}.png`;
  } else {
    imagePath = `/Assets/${id}.png`;
  }
  
  return {
    id,
    ...attributes,
    imagePath
  };
};

// 사용하지 않은 카드 ID에서 무작위로 n개 선택
export const getRandomUnusedCardIds = (usedCardIds: number[], count: number, excludeIds: number[] = []): number[] => {
  const allCardIds = Array.from({ length: 27 }, (_, i) => i + 1);
  
  // 이미 사용된 카드와 제외할 카드 ID를 필터링
  const unusedCardIds = allCardIds.filter(id => 
    !usedCardIds.includes(id) && !excludeIds.includes(id)
  );
  
  // 사용하지 않은 카드가 충분하지 않으면 모든 카드를 다시 사용
  if (unusedCardIds.length < count) {
    console.warn('사용 가능한 카드가 부족합니다. 모든 카드를 다시 사용합니다.');
    return shuffleArray(
      allCardIds.filter(id => !excludeIds.includes(id))
    ).slice(0, count);
  }
  
  return shuffleArray(unusedCardIds).slice(0, count);
};

// 배열 섞기 함수
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 보드 초기화 함수
export const initializeBoard = (usedCardIds: number[] = []): Card[] => {
  // 모든 가능한 카드 ID 중에서 중복 없이 9개 선택
  const allCardIds = Array.from({ length: 27 }, (_, i) => i + 1);
  const availableCardIds = allCardIds.filter(id => !usedCardIds.includes(id));
  
  if (availableCardIds.length < 9) {
    console.warn('사용 가능한 카드가 9개 미만입니다. 모든 카드를 다시 사용합니다.');
    // 카드가 부족하면 전체에서 랜덤하게 9개 선택
    return shuffleArray(allCardIds).slice(0, 9).map(id => createCard(id));
  }
  
  // 사용 가능한 카드 중에서 9개 선택
  const cardIds = shuffleArray(availableCardIds).slice(0, 9);
  
  // 중복 확인
  const uniqueCardIds = new Set(cardIds);
  if (uniqueCardIds.size !== 9) {
    console.error('중복된 카드가 선택되었습니다!', cardIds);
  }
  
  return cardIds.map(id => createCard(id));
};

// 보드 갱신 함수 (선택된 카드 대체)
export const refreshBoard = (currentBoard: Card[], selectedCardIds: number[], usedCardIds: number[]): Card[] => {
  const newBoard = [...currentBoard];
  
  // 현재 보드에 있는 모든 카드 ID (중복 방지용)
  const currentBoardIds = newBoard.map(card => card.id).filter(id => !selectedCardIds.includes(id));
  
  // 새로운 카드를 선택할 때 현재 보드에 있는 카드는 제외
  const newCardIds = getRandomUnusedCardIds(usedCardIds, selectedCardIds.length, currentBoardIds);
  
  // 중복 확인
  const uniqueNewCardIds = new Set(newCardIds);
  if (uniqueNewCardIds.size !== selectedCardIds.length) {
    console.error('중복된 새 카드가 선택되었습니다!', newCardIds);
  }
  
  // 선택된 카드를 새 카드로 교체
  selectedCardIds.forEach((selectedId, index) => {
    const boardIndex = newBoard.findIndex(card => card.id === selectedId);
    if (boardIndex !== -1 && index < newCardIds.length) {
      newBoard[boardIndex] = createCard(newCardIds[index]);
    }
  });
  
  // 최종 보드의 카드들이 중복되지 않는지 확인
  const finalBoardIds = newBoard.map(card => card.id);
  const uniqueIds = new Set(finalBoardIds);
  
  if (uniqueIds.size !== finalBoardIds.length) {
    console.error('최종 보드에 중복된 카드가 있습니다!', finalBoardIds);
    
    // 중복 수정: 중복된 카드 찾아서 새 카드로 교체
    const duplicates = finalBoardIds.filter((id, index) => finalBoardIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.warn('중복 카드를 새 카드로 교체합니다:', duplicates);
      
      // 중복된 카드의 두 번째 등장부터 교체
      duplicates.forEach(dupId => {
        const firstIndex = finalBoardIds.indexOf(dupId);
        const secondIndex = finalBoardIds.indexOf(dupId, firstIndex + 1);
        
        if (secondIndex !== -1) {
          // 중복되지 않는 새 카드 ID 찾기
          const allIds = Array.from({ length: 27 }, (_, i) => i + 1);
          const availableIds = allIds.filter(id => !finalBoardIds.includes(id) && !usedCardIds.includes(id));
          
          if (availableIds.length > 0) {
            const newId = availableIds[0];
            newBoard[secondIndex] = createCard(newId);
            finalBoardIds[secondIndex] = newId;
          }
        }
      });
    }
  }
  
  return newBoard;
};

export function findAllValidCombinations(board: Card[]): Card[][] {
  const validCombinations: Card[][] = [];
  
  // 보드에 카드가 3장 미만인 경우 빈 배열 반환
  if (board.length < 3) {
    console.warn('보드에 카드가 3장 미만입니다:', board.length);
    return validCombinations;
  }
  
  // 디버깅용 로그 추가
  console.log('보드 카드 수:', board.length);
  
  // 모든 가능한 3장의 조합을 생성
  for (let i = 0; i < board.length - 2; i++) {
    for (let j = i + 1; j < board.length - 1; j++) {
      for (let k = j + 1; k < board.length; k++) {
        const combination = [board[i], board[j], board[k]];
        const validation = compareAttributes(combination);
        
        if (validation.isValid) {
          validCombinations.push(combination);
          // 디버깅용 로그 추가
          console.log('유효한 조합 발견:', combination.map(card => card.id));
        }
      }
    }
  }
  
  // 디버깅용 로그 추가
  console.log('찾은 유효한 조합 수:', validCombinations.length);
  
  return validCombinations;
} 