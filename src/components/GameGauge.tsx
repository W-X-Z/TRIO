import React from 'react';
import './GameGauge.css';

interface GameGaugeProps {
  playerGauge: number;  // 0-100 사이의 값
  bossGauge: number;   // 0-100 사이의 값
  width: number;       // 게이지 전체 너비
}

const GameGauge: React.FC<GameGaugeProps> = ({ playerGauge, bossGauge, width }) => {
  return (
    <div className="game-gauge" style={{ width: `${width}px` }}>
      <div className="profile player-profile">
        <img src={process.env.PUBLIC_URL + '/Assets/Player.png'} alt="Player" />
      </div>
      
      <div className="gauge-container">
        <div 
          className="player-gauge"
          style={{ width: `${playerGauge}%` }}
        />
        <div 
          className="boss-gauge"
          style={{ width: `${bossGauge}%`, right: 0 }}
        />
      </div>
      
      <div className="profile boss-profile">
        <img src={process.env.PUBLIC_URL + '/Assets/Boss01.png'} alt="Boss" />
      </div>
    </div>
  );
};

export default GameGauge; 