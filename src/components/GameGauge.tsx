import React, { useEffect, useRef } from 'react';
import './GameGauge.css';

interface GameGaugeProps {
  playerGauge: number;  // 0-100 사이의 값
  bossGauge: number;   // 0-100 사이의 값
  width: number;       // 게이지 전체 너비
  onGaugeCollision?: (playerGauge: number, bossGauge: number) => void;
}

const GameGauge: React.FC<GameGaugeProps> = ({ 
  playerGauge, 
  bossGauge, 
  width,
  onGaugeCollision 
}) => {
  const lastPlayerGauge = useRef(playerGauge);
  const lastBossGauge = useRef(bossGauge);

  useEffect(() => {
    // 게이지 충돌 감지
    const totalGauge = playerGauge + bossGauge;
    if (totalGauge > 100) {
      // 충돌이 발생한 경우
      const overlap = totalGauge - 100;
      const playerStrength = playerGauge - lastPlayerGauge.current;
      const bossStrength = bossGauge - lastBossGauge.current;
      
      // 강한 쪽이 약한 쪽을 밀어냄
      if (playerStrength > bossStrength) {
        onGaugeCollision?.(playerGauge, Math.max(0, bossGauge - overlap));
      } else {
        onGaugeCollision?.(Math.max(0, playerGauge - overlap), bossGauge);
      }
    }

    lastPlayerGauge.current = playerGauge;
    lastBossGauge.current = bossGauge;
  }, [playerGauge, bossGauge, onGaugeCollision]);

  return (
    <div className="game-gauge" style={{ width: `${width}px` }}>
      <div className="profile player-profile">
        <img src={process.env.PUBLIC_URL + '/Assets/Player.png'} alt="Player" />
      </div>
      
      <div className="gauge-container">
        <div 
          className="player-gauge"
          style={{ 
            width: `${Math.min(playerGauge, 100 - bossGauge)}%`,
            transition: 'width 0.1s linear'
          }}
        />
        <div 
          className="boss-gauge"
          style={{ 
            width: `${Math.min(bossGauge, 100 - playerGauge)}%`,
            transition: 'width 0.1s linear'
          }}
        />
      </div>
      
      <div className="profile boss-profile">
        <img src={process.env.PUBLIC_URL + '/Assets/Boss01.png'} alt="Boss" />
      </div>
    </div>
  );
};

export default GameGauge; 