import React from 'react';
import { Card } from '../types/types';
import './GameBoard.css';

interface GameBoardProps {
  board: Card[];
  selectedCards: Card[];
  computerSelectedCards: Card[];
  possibleCombinations: Card[][];
  fadingCards: number[];
  blackFadingCards: number[];
  isComputerThinking: boolean;
  onCardClick: (card: Card) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  board, 
  selectedCards, 
  computerSelectedCards,
  possibleCombinations,
  fadingCards,
  blackFadingCards,
  isComputerThinking,
  onCardClick 
}) => {
  // 3x3 보드에 필요한 9개 카드만 사용
  const boardCards = board.slice(0, 9);
  
  // 종족, 직업, 성향 한글 변환 함수
  const getRaceText = (race: Card['race']): string => {
    const raceMap: Record<Card['race'], string> = {
      'human': '인간',
      'elf': '엘프',
      'dwarf': '드워프'
    };
    return raceMap[race];
  };

  const getJobText = (job: Card['job']): string => {
    const jobMap: Record<Card['job'], string> = {
      'warrior': '전사',
      'mage': '마법사',
      'archer': '궁수'
    };
    return jobMap[job];
  };

  const getAlignmentText = (alignment: Card['alignment']): string => {
    const alignmentMap: Record<Card['alignment'], string> = {
      'cold': '냉철',
      'order': '열정',
      'chaos': '혼돈'
    };
    return alignmentMap[alignment];
  };
  
  // 카드가 페이드아웃 중인지 확인
  const isCardFading = (card: Card): boolean => {
    return fadingCards.includes(card.id);
  };
  
  // 카드가 검은색 페이드아웃 중인지 확인
  const isCardBlackFading = (card: Card): boolean => {
    return blackFadingCards.includes(card.id);
  };
  
  // 카드가 컴퓨터에 의해 선택되었는지 확인
  const isCardSelectedByComputer = (card: Card): boolean => {
    return computerSelectedCards.some(c => c.id === card.id);
  };
  
  return (
    <div className={`game-board ${isComputerThinking ? 'computer-thinking' : 'player-turn'}`}>
      {boardCards.map((card) => {
        const isSelected = selectedCards.some(c => c.id === card.id);
        const isComputerSelected = isCardSelectedByComputer(card);
        const isFading = isCardFading(card);
        const isBlackFading = isCardBlackFading(card);
        
        return (
          <div 
            key={card.id} 
            className={`card 
              ${isSelected ? 'selected' : ''} 
              ${isComputerSelected ? 'computer-selected' : ''} 
              ${isFading ? 'fading' : ''}
              ${isBlackFading ? 'black-fading' : ''}`
            }
            onClick={() => onCardClick(card)}
          >
            <img 
              src={card.imagePath} 
              alt={`${card.race} ${card.job} (${card.alignment})`} 
            />
            <div className="card-info">
              <div className="card-summary">
                {`${getRaceText(card.race)} ${getJobText(card.job)} (${getAlignmentText(card.alignment)})`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard; 