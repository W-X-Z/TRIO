import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Toast from './components/Toast';
import { initializeBoard, compareAttributes, refreshBoard } from './utils/gameLogic';
import { Card, ValidationResult, ToastMessage } from './types/types';

function App() {
  const [board, setBoard] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [computerScore, setComputerScore] = useState<number>(0);
  const [usedCardIds, setUsedCardIds] = useState<number[]>([]);
  const [toast, setToast] = useState<ToastMessage>({
    isVisible: false,
    type: 'success',
    message: ''
  });
  const [possibleCombinations, setPossibleCombinations] = useState<Card[][]>([]);
  const [fadingCards, setFadingCards] = useState<number[]>([]);
  const [blackFadingCards, setBlackFadingCards] = useState<number[]>([]);
  const [computerSelectedCards, setComputerSelectedCards] = useState<Card[]>([]);
  const [isComputerThinking, setIsComputerThinking] = useState<boolean>(false);
  const computerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastComputerMoveTimeRef = useRef<number>(Date.now());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // 가능한 모든 3장 조합을 확인하는 함수
  const findAllValidCombinations = useCallback((): Card[][] => {
    if (!board || board.length < 9) {
      return [];
    }
    
    const boardCards = board.slice(0, 9);
    const validCombinations: Card[][] = [];
    
    // 모든 가능한 3장 조합 생성
    for (let i = 0; i < boardCards.length; i++) {
      for (let j = i + 1; j < boardCards.length; j++) {
        for (let k = j + 1; k < boardCards.length; k++) {
          const combination = [boardCards[i], boardCards[j], boardCards[k]];
          // 유효한 조합인지 확인
          if (compareAttributes(combination).isValid) {
            validCombinations.push(combination);
          }
        }
      }
    }
    
    return validCombinations;
  }, [board]);
  
  // 순수 함수로 컴퓨터 턴 실행 (의존성 없음)
  function executeComputerTurnFn() {
    // 상태 확인
    if (isProcessingRef.current || fadingCards.length > 0 || blackFadingCards.length > 0) {
      // 2초 후 다시 시도
      setTimeout(() => {
        if (!isProcessingRef.current && fadingCards.length === 0 && blackFadingCards.length === 0) {
          executeComputerTurnFn();
        }
      }, 2000);
      return;
    }
    
    try {
      // 컴퓨터 실행 시간 기록
      lastComputerMoveTimeRef.current = Date.now();
      
      const validCombinations = findAllValidCombinations();
      
      if (validCombinations.length > 0) {
        // 유효한 조합이 있을 경우 랜덤으로 하나 선택
        const randomIndex = Math.floor(Math.random() * validCombinations.length);
        const selectedCombination = validCombinations[randomIndex];
        
        // 세 장의 카드를 한꺼번에 선택 (컴퓨터는 즉시 선택)
        setComputerSelectedCards(selectedCombination);
      } else {
        // 유효한 조합이 없을 경우 NO TEAM 선택
        executeComputerNoTeamFn();
      }
      
      setIsComputerThinking(false);
    } catch (error) {
      console.error('컴퓨터 턴 처리 중 오류 발생:', error);
      // 오류 복구
      isProcessingRef.current = false;
      setIsComputerThinking(false);
      
      // 3초 후에 다시 시작
      setTimeout(startComputerTurnFn, 3000);
    }
  }
  
  // 순수 함수로 컴퓨터 턴 시작 (의존성 없음)
  function startComputerTurnFn() {
    // 일시정지 상태거나 이미 처리 중이거나 페이드아웃 중이면 스킵
    if (isPaused || isProcessingRef.current || fadingCards.length > 0 || blackFadingCards.length > 0) {
      return false;
    }
    
    setIsComputerThinking(true);
    lastComputerMoveTimeRef.current = Date.now();
    
    // 컴퓨터의 응답 시간을 10~20초 사이로 랜덤 설정
    const computerDelay = 10000 + Math.random() * 10000;
    
    // 이전 타이머가 있으면 정리
    if (computerTimerRef.current) {
      clearTimeout(computerTimerRef.current);
      computerTimerRef.current = null;
    }
    
    computerTimerRef.current = setTimeout(executeComputerTurnFn, computerDelay);
    
    return true;
  }
  
  // 순수 함수로 컴퓨터 NO TEAM 실행 (의존성 없음)
  function executeComputerNoTeamFn() {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    // 유효한 조합이 없는 경우 - 점수 추가 및 보드 새로고침
    setComputerScore(prevScore => prevScore + 10);
    setToast({
      isVisible: true,
      type: 'error',
      message: '컴퓨터가 NO TEAM을 선택했습니다! +10점'
    });
    
    // 모든 카드 새로고침
    const boardCardIds = board.slice(0, 9).map(card => card.id);
    
    // 페이드아웃 효과를 위해 모든 카드 ID 저장 (검은색 페이드아웃)
    setBlackFadingCards(boardCardIds);
    
    // 타이머 설정: 페이드아웃 효과 후 새 카드로 교체
    setTimeout(() => {
      try {
        // 사용된 카드 ID 추가
        setUsedCardIds(prev => [...prev, ...boardCardIds]);
        setBlackFadingCards([]);
        
        // 새 라운드 시작
        startNewRoundFn();
      } catch (error) {
        console.error('컴퓨터 NO TEAM 처리 중 오류 발생:', error);
        // 오류 복구
        isProcessingRef.current = false;
        setBlackFadingCards([]);
        startNewRoundFn();
      }
    }, 1000);
  }
  
  // 순수 함수로 새 라운드 시작 (의존성 없음)
  function startNewRoundFn() {
    // 이전 타이머들 초기화
    if (computerTimerRef.current) {
      clearTimeout(computerTimerRef.current);
      computerTimerRef.current = null;
    }
    
    // 새로운 보드 초기화
    const initialBoard = initializeBoard(usedCardIds);
    setBoard(initialBoard);
    
    // 선택 상태 초기화
    setSelectedCards([]);
    setComputerSelectedCards([]);
    setPossibleCombinations([]);
    setFadingCards([]);
    setBlackFadingCards([]);
    isProcessingRef.current = false;
    
    // 개발 디버깅용: 중복 카드 체크
    const boardIds = initialBoard.map(card => card.id);
    const uniqueIds = new Set(boardIds);
    if (uniqueIds.size !== boardIds.length) {
      console.error('초기 보드에 중복된 카드가 있습니다!', boardIds);
    }
    
    // 컴퓨터 턴 시작
    setTimeout(startComputerTurnFn, 100);
  }
  
  // 카드 선택 핸들러
  const handleCardSelect = useCallback((card: Card) => {
    if (fadingCards.length > 0 || blackFadingCards.length > 0 || isProcessingRef.current) return; // 카드 페이드아웃 중이나 처리 중이면 선택 불가
    
    if (selectedCards.some(c => c.id === card.id)) {
      // 이미 선택된 카드면 선택 취소
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < 3) {
      // 3장 미만이면 선택
      setSelectedCards([...selectedCards, card]);
    }
  }, [selectedCards, fadingCards, blackFadingCards]);
  
  // 플레이어 선택 카드 검증
  const validateSelection = useCallback(() => {
    if (selectedCards.length === 3) {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      
      // 이전 컴퓨터 타이머 취소
      if (computerTimerRef.current) {
        clearTimeout(computerTimerRef.current);
        computerTimerRef.current = null;
      }
      
      try {
        const result = compareAttributes(selectedCards);
        setValidationResult(result);
        
        if (result.isValid) {
          // 유효한 조합일 경우
          setPlayerScore(prevScore => prevScore + 1);
          
          // 사용된 카드 ID 추가
          const selectedIds = selectedCards.map(card => card.id);
          setUsedCardIds(prev => [...prev, ...selectedIds]);
          
          // 토스트 메시지 표시
          setToast({
            isVisible: true,
            type: 'success',
            message: '유효한 조합입니다! +1점'
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
              setComputerSelectedCards([]);
              // 처리 상태 해제
              isProcessingRef.current = false;
              // 가능한 조합 초기화
              setPossibleCombinations([]);
              
              // 컴퓨터 다음 생각 시작
              setTimeout(startComputerTurnFn, 100);
              
              // 개발 디버깅용: 중복 카드 체크
              const newBoardIds = newBoard.map(card => card.id);
              const uniqueIds = new Set(newBoardIds);
              if (uniqueIds.size !== newBoardIds.length) {
                console.error('플레이어 턴 후 새 보드에 중복된 카드가 있습니다!', newBoardIds);
              }
            } catch (error) {
              console.error('플레이어 선택 처리 완료 중 오류 발생:', error);
              // 오류 복구
              isProcessingRef.current = false;
              setFadingCards([]);
              startNewRoundFn();
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
          
          // 컴퓨터 턴 다시 시작
          startComputerTurnFn();
        }
      } catch (error) {
        console.error('플레이어 선택 검증 중 오류 발생:', error);
        // 오류 복구
        setSelectedCards([]);
        isProcessingRef.current = false;
        startComputerTurnFn();
      }
    }
  }, [selectedCards.length, board, usedCardIds]);
  
  // 컴퓨터 선택 카드 검증
  const validateComputerSelection = useCallback(() => {
    if (computerSelectedCards.length === 3) {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      
      try {
        const result = compareAttributes(computerSelectedCards);
        
        if (result.isValid) {
          // 유효한 조합일 경우
          const selectedIds = computerSelectedCards.map(card => card.id);
          
          // 검은색 페이드아웃 효과를 위해 선택된 카드 ID 저장
          setBlackFadingCards(selectedIds);
          
          // 약간의 지연 후 점수 추가 및 UI 갱신
          setTimeout(() => {
            setComputerScore(prevScore => prevScore + 1);
            
            // 토스트 메시지 표시
            setToast({
              isVisible: true,
              type: 'error',
              message: '컴퓨터가 조합을 찾았습니다! +1점'
            });
            
            // 사용된 카드 ID 추가
            setUsedCardIds(prev => [...prev, ...selectedIds]);
            
            // 타이머 설정: 페이드아웃 효과 후 새 카드로 교체
            setTimeout(() => {
              try {
                // 선택된 카드 교체
                const newBoard = refreshBoard(board, selectedIds, usedCardIds);
                setBoard(newBoard);
                // 페이드아웃 효과 해제
                setBlackFadingCards([]);
                // 선택 초기화
                setComputerSelectedCards([]);
                setSelectedCards([]);
                // 처리 상태 해제
                isProcessingRef.current = false;
                
                // 컴퓨터 다음 생각 시작
                setTimeout(startComputerTurnFn, 100);
                
                // 개발 디버깅용: 중복 카드 체크
                const newBoardIds = newBoard.map(card => card.id);
                const uniqueIds = new Set(newBoardIds);
                if (uniqueIds.size !== newBoardIds.length) {
                  console.error('컴퓨터 턴 후 새 보드에 중복된 카드가 있습니다!', newBoardIds);
                }
              } catch (error) {
                console.error('컴퓨터 선택 처리 완료 중 오류 발생:', error);
                // 오류 복구
                isProcessingRef.current = false;
                setBlackFadingCards([]);
                startNewRoundFn();
              }
            }, 800);
          }, 1000);
        } else {
          // 유효하지 않은 조합일 경우 (이 경우는 일어나지 않아야 함)
          console.error('컴퓨터가 유효하지 않은 조합을 선택했습니다:', computerSelectedCards);
          setComputerSelectedCards([]);
          isProcessingRef.current = false;
          startComputerTurnFn();
        }
      } catch (error) {
        console.error('컴퓨터 선택 검증 중 오류 발생:', error);
        // 오류 복구
        isProcessingRef.current = false;
        setComputerSelectedCards([]);
        startComputerTurnFn();
      }
    }
  }, [computerSelectedCards.length, board, usedCardIds]);
  
  // NO TEAM 버튼 클릭 핸들러
  const handleNoTeam = useCallback(() => {
    if (fadingCards.length > 0 || blackFadingCards.length > 0 || isProcessingRef.current) return; // 카드 페이드아웃 중이나 처리 중이면 동작 불가
    isProcessingRef.current = true;
    
    // 이전 컴퓨터 타이머 취소
    if (computerTimerRef.current) {
      clearTimeout(computerTimerRef.current);
      computerTimerRef.current = null;
    }
    
    try {
      const validCombinations = findAllValidCombinations();
      
      if (validCombinations.length === 0) {
        // 유효한 조합이 없는 경우 - 점수 추가 및 보드 새로고침
        setPlayerScore(prevScore => prevScore + 10);
        setToast({
          isVisible: true,
          type: 'success',
          message: '정확합니다! 가능한 조합이 없습니다. +10점'
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
            startNewRoundFn();
          } catch (error) {
            console.error('NO TEAM 처리 완료 중 오류 발생:', error);
            // 오류 복구
            isProcessingRef.current = false;
            setFadingCards([]);
            startNewRoundFn();
          }
        }, 600);
      } else {
        // 유효한 조합이 있는 경우 - 점수 감점
        setPlayerScore(prevScore => Math.max(0, prevScore - 5)); // 최소 0점까지만 감점
        setToast({
          isVisible: true,
          type: 'error',
          message: '가능한 조합이 있습니다! -5점'
        });
        
        // 선택 초기화
        setSelectedCards([]);
        isProcessingRef.current = false;
        
        // 컴퓨터 턴 다시 시작
        startComputerTurnFn();
      }
    } catch (error) {
      console.error('NO TEAM 버튼 처리 중 오류 발생:', error);
      // 오류 복구
      isProcessingRef.current = false;
      startComputerTurnFn();
    }
  }, [fadingCards.length, blackFadingCards.length, findAllValidCombinations, board]);
  
  // 컴퓨터 일시정지/재개 토글 핸들러
  const handlePauseToggle = useCallback(() => {
    setIsPaused(prev => {
      const newPausedState = !prev;
      
      if (newPausedState) {
        // 일시정지 - 현재 타이머 취소
        if (computerTimerRef.current) {
          clearTimeout(computerTimerRef.current);
          computerTimerRef.current = null;
        }
        setIsComputerThinking(false);
      } else {
        // 재개 - 처리 중이 아니면 다시 시작
        if (!isProcessingRef.current && fadingCards.length === 0 && blackFadingCards.length === 0) {
          startComputerTurnFn();
        }
      }
      
      return newPausedState;
    });
  }, [fadingCards.length, blackFadingCards.length]);
  
  // 컴퓨터가 일정 시간 동안 움직이지 않으면 재시작시키는 감시 기능
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastMove = now - lastComputerMoveTimeRef.current;
      
      // 일시정지 상태가 아니고, 60초 이상 컴퓨터가 움직이지 않았을 경우 (이는 오류 상태로 간주)
      if (!isPaused && isComputerThinking && timeSinceLastMove > 60000 && !isProcessingRef.current) {
        console.log('컴퓨터가 오랫동안 응답이 없어 자동으로 재시작합니다.');
        if (computerTimerRef.current) {
          clearTimeout(computerTimerRef.current);
          computerTimerRef.current = null;
        }
        
        // 컴퓨터 턴 재시작
        startComputerTurnFn();
      }
    };
    
    // 10초마다 비활성 상태 확인
    watchdogTimerRef.current = setInterval(checkInactivity, 10000);
    
    return () => {
      if (watchdogTimerRef.current) {
        clearInterval(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };
  }, [isComputerThinking, isPaused]);
  
  // 3장의 카드가 선택될 때마다 자동으로 유효성 검증
  useEffect(() => {
    if (selectedCards.length === 3 && !isProcessingRef.current) {
      validateSelection();
    }
  }, [selectedCards.length, validateSelection]);
  
  // 컴퓨터 선택 카드 검증
  useEffect(() => {
    if (computerSelectedCards.length === 3 && !isProcessingRef.current) {
      validateComputerSelection();
    }
  }, [computerSelectedCards.length, validateComputerSelection]);
  
  // 보드 초기화
  useEffect(() => {
    // 게임 시작 - 일시정지 상태가 아닐 때만 컴퓨터 턴 시작
    startNewRoundFn();
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (computerTimerRef.current) {
        clearTimeout(computerTimerRef.current);
        computerTimerRef.current = null;
      }
      if (watchdogTimerRef.current) {
        clearInterval(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="app">
      <h1>TRIO</h1>
      <div className="game-controls">
        <div className="game-scores">
          <div className="player-score">
            플레이어: {playerScore}
          </div>
          <div className="computer-score">
            컴퓨터: {computerScore} {isComputerThinking && !isPaused && '🤔'}
          </div>
        </div>
        <button 
          className={`pause-btn ${isPaused ? 'paused' : ''}`}
          onClick={handlePauseToggle}
        >
          {isPaused ? '컴퓨터 재개' : '컴퓨터 일시정지'}
        </button>
      </div>
      <div className="game-container">
        <GameBoard 
          board={board}
          selectedCards={selectedCards}
          computerSelectedCards={computerSelectedCards}
          possibleCombinations={[]}
          fadingCards={fadingCards}
          blackFadingCards={blackFadingCards}
          isComputerThinking={isComputerThinking}
          onCardClick={handleCardSelect}
        />
        <div className="no-team-container">
          <button
            className="no-team-btn"
            onClick={handleNoTeam}
            disabled={fadingCards.length > 0 || blackFadingCards.length > 0 || isProcessingRef.current}
          >
            조합 없음
          </button>
        </div>
      </div>
      <Toast toast={toast} setToast={setToast} />
    </div>
  );
}

export default App; 