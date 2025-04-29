import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GameOverModal from './components/GameOverModal';
import './App.css';
import GameBoard from './components/GameBoard';
import GameGauge from './components/GameGauge';
import Toast from './components/Toast';
import { Card, ToastState } from './types/types';
import { compareAttributes, initializeBoard, refreshBoard, findAllValidCombinations } from './utils/gameLogic';

// 난이도별 설정
const DIFFICULTY_SETTINGS = {
  easy: {
    bossGaugeRate: 0.2, // 초당 0.2%씩 증가
    scoreMultiplier: 1,
    maxMistakes: 5
  },
  normal: {
    bossGaugeRate: 0.4, // 초당 0.4%씩 증가
    scoreMultiplier: 2,
    maxMistakes: 3
  },
  hard: {
    bossGaugeRate: 1, // 초당 0.8%씩 증가
    scoreMultiplier: 3,
    maxMistakes: 1
  }
};

const GamePage: React.FC = () => {
  const location = useLocation();
  const difficulty = (location.state?.difficulty || 'normal') as keyof typeof DIFFICULTY_SETTINGS;
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  const [board, setBoard] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [usedCardIds, setUsedCardIds] = useState<number[]>([]);
  const [fadingCards, setFadingCards] = useState<number[]>([]);
  const [toast, setToast] = useState<ToastState>({ isVisible: false, message: '', type: 'success' });
  const [playerGauge, setPlayerGauge] = useState(0);
  const [bossGauge, setBossGauge] = useState(0);
  const [boardHeight, setBoardHeight] = useState(0);
  const [boardWidth, setBoardWidth] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const isProcessingRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // 보드 높이 측정
  useEffect(() => {
    if (boardRef.current) {
      setBoardHeight(boardRef.current.offsetHeight);
      setBoardWidth(boardRef.current.offsetWidth);
    }
  }, []);

  // 게이지 증가 로직
  const increaseGauge = useCallback((isPlayer: boolean) => {
    if (isPlayer) {
      setPlayerGauge(prev => {
        const newValue = Math.min(100, prev + 20);
        if (newValue >= 100) {
          setToast({
            isVisible: true,
            type: 'success',
            message: '승리! 플레이어가 먼저 게이지를 채웠습니다!'
          });
          setTimeout(() => {
            resetGame();
          }, 2000);
        }
        return newValue;
      });
    } else {
      setBossGauge(prev => {
        const newValue = Math.min(100, prev + settings.bossGaugeRate);
        if (newValue >= 100) {
          setToast({
            isVisible: true,
            type: 'error',
            message: '패배! 보스가 먼저 게이지를 채웠습니다!'
          });
          setTimeout(() => {
            setIsGameOver(true);
          }, 2000);
        }
        return newValue;
      });
    }
  }, [settings.bossGaugeRate]);

  // 게이지 충돌 처리
  const handleGaugeCollision = useCallback((newPlayerGauge: number, newBossGauge: number) => {
    setPlayerGauge(newPlayerGauge);
    setBossGauge(newBossGauge);
  }, []);

  // 게임 리셋
  const resetGame = useCallback(() => {
    setPlayerGauge(0);
    setBossGauge(0);
    setPlayerScore(0);
    setUsedCardIds([]);
    setMistakes(0);
    setIsGameOver(false);
    startNewRound();
  }, []);

  // 자동 보스 게이지 증가 (requestAnimationFrame 사용)
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const updateGauge = (currentTime: number) => {
      if (playerGauge < 100 && bossGauge < 100 && !isGameOver) {
        const deltaTime = (currentTime - lastTime) / 1000; // 초 단위로 변환
        setBossGauge(prev => Math.min(100, prev + settings.bossGaugeRate * deltaTime));
        lastTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(updateGauge);
    };

    animationFrameId = requestAnimationFrame(updateGauge);
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerGauge, bossGauge, isGameOver, settings.bossGaugeRate]);

  // 카드 선택 핸들러
  const handleCardSelect = useCallback((card: Card) => {
    if (fadingCards.length > 0 || isProcessingRef.current) return;
    
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, card]);
    }
  }, [selectedCards, fadingCards]);

  // 플레이어 선택 카드 검증
  const validateSelection = useCallback(() => {
    if (selectedCards.length === 3) {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      
      try {
        const result = compareAttributes(selectedCards);
        
        if (result.isValid) {
          // 유효한 조합일 경우
          setPlayerScore(prevScore => prevScore + (10 * settings.scoreMultiplier));
          increaseGauge(true); // 플레이어 게이지 증가
          
          // 사용된 카드 ID 추가
          const selectedIds = selectedCards.map(card => card.id);
          setUsedCardIds(prev => [...prev, ...selectedIds]);
          
          // 토스트 메시지 표시
          setToast({
            isVisible: true,
            type: 'success',
            message: `유효한 조합입니다! +${10 * settings.scoreMultiplier}점`
          });
          
          // 페이드아웃 효과를 위해 선택된 카드 ID 저장
          setFadingCards(selectedIds);
          
          // 타이머 설정: 페이드아웃 효과 후 새 카드로 교체
          setTimeout(() => {
            try {
              // 선택된 카드 교체
              const newBoard = refreshBoard(board, selectedIds, usedCardIds);
              setBoard(newBoard);
              // 페이드아웃 효과 해제
              setFadingCards([]);
              // 선택 초기화
              setSelectedCards([]);
              // 처리 상태 해제
              isProcessingRef.current = false;
            } catch (error) {
              console.error('플레이어 선택 처리 완료 중 오류 발생:', error);
              // 오류 복구
              isProcessingRef.current = false;
              setFadingCards([]);
              startNewRound();
            }
          }, 600);
        } else {
          // 유효하지 않은 조합일 경우
          setToast({
            isVisible: true,
            type: 'error',
            message: '유효하지 않은 조합입니다.'
          });
          
          // 선택 초기화
          setSelectedCards([]);
          isProcessingRef.current = false;
        }
      } catch (error) {
        console.error('플레이어 선택 검증 중 오류 발생:', error);
        // 오류 복구
        setSelectedCards([]);
        isProcessingRef.current = false;
      }
    }
  }, [selectedCards, board, usedCardIds, increaseGauge, settings.scoreMultiplier]);

  // NO TEAM 버튼 클릭 핸들러
  const handleNoTeam = useCallback(() => {
    if (fadingCards.length > 0 || isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    try {
      const validCombinations = findAllValidCombinations(board.slice(0, 9));
      
      if (validCombinations.length === 0) {
        // 유효한 조합이 없는 경우 - 점수 추가 및 보드 새로고침
        setPlayerScore(prevScore => prevScore + (10 * settings.scoreMultiplier));
        increaseGauge(true); // 플레이어 게이지 증가
        setToast({
          isVisible: true,
          type: 'success',
          message: `정확합니다! 가능한 조합이 없습니다. +${10 * settings.scoreMultiplier}점`
        });

        // 모든 카드 새로고침
        const boardCardIds = board.slice(0, 9).map(card => card.id);
        
        // 페이드아웃 효과를 위해 모든 카드 ID 저장
        setFadingCards(boardCardIds);
        
        // 타이머 설정: 페이드아웃 효과 후 새 카드로 교체
        setTimeout(() => {
          try {
            // 사용된 카드 ID 추가
            setUsedCardIds(prev => [...prev, ...boardCardIds]);
            
            // 새 라운드 시작
            startNewRound();
          } catch (error) {
            console.error('NO TEAM 처리 완료 중 오류 발생:', error);
            // 오류 복구
            isProcessingRef.current = false;
            setFadingCards([]);
            startNewRound();
          }
        }, 600);
      } else {
        // 유효한 조합이 있는 경우 - 실수 횟수 증가
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);
        
        if (newMistakes >= settings.maxMistakes) {
          setIsGameOver(true);
        }
        
        increaseGauge(false); // 보스 게이지 증가
        setToast({
          isVisible: true,
          type: 'error',
          message: '가능한 조합이 있습니다!'
        });
        
        // 선택 초기화
        setSelectedCards([]);
        isProcessingRef.current = false;
      }
    } catch (error) {
      console.error('NO TEAM 버튼 처리 중 오류 발생:', error);
      // 오류 복구
      isProcessingRef.current = false;
    }
  }, [board, fadingCards.length, increaseGauge, settings.scoreMultiplier, settings.maxMistakes, mistakes]);

  // 새 라운드 시작
  const startNewRound = () => {
    // 새로운 보드 초기화
    const initialBoard = initializeBoard(usedCardIds);
    setBoard(initialBoard);
    
    // 선택 상태 초기화
    setSelectedCards([]);
    setFadingCards([]);
    isProcessingRef.current = false;
  };

  // 3장의 카드가 선택될 때마다 자동으로 유효성 검증
  useEffect(() => {
    if (selectedCards.length === 3 && !isProcessingRef.current) {
      validateSelection();
    }
  }, [selectedCards.length, validateSelection]);

  // 보드 초기화
  useEffect(() => {
    startNewRound();
  }, []);

  return (
    <div className="app">
      <h1>TRIO</h1>
      <div className="game-area">
        <div className="game-container" ref={boardRef}>
          <div className="gauge-wrapper">
            <GameGauge 
              playerGauge={playerGauge} 
              bossGauge={bossGauge} 
              width={boardWidth} 
              onGaugeCollision={handleGaugeCollision}
            />
          </div>
          <GameBoard 
            board={board}
            selectedCards={selectedCards}
            computerSelectedCards={[]}
            possibleCombinations={[]}
            fadingCards={fadingCards}
            blackFadingCards={[]}
            isComputerThinking={false}
            onCardClick={handleCardSelect}
          />
          <div className="no-team-container">
            <button
              className="no-team-btn"
              onClick={handleNoTeam}
              disabled={fadingCards.length > 0 || isProcessingRef.current}
            >
              NO TEAM
            </button>
          </div>
        </div>
        {isGameOver && (
          <GameOverModal 
            score={playerScore} 
            onRetry={resetGame}
          />
        )}
      </div>
      <Toast toast={toast} setToast={setToast} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </Router>
  );
};

export default App; 