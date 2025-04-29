import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GameOverModal.css';

interface GameOverModalProps {
  score: number;
  onRetry: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, onRetry }) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="game-over-title">Game Over</h2>
        <p className="score-text">Final Score: {score}</p>
        <div className="modal-buttons">
          <button className="modal-btn retry-btn" onClick={onRetry}>
            Retry
          </button>
          <button className="modal-btn home-btn" onClick={handleHomeClick}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal; 