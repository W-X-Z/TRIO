import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleDifficultySelect = (difficulty: 'easy' | 'normal' | 'hard') => {
    navigate('/game', { state: { difficulty } });
  };

  return (
    <div className="landing-page">
      <h1 className="game-title">TRIO</h1>
      <div className="difficulty-buttons">
        <button 
          className="difficulty-btn easy-btn"
          onClick={() => handleDifficultySelect('easy')}
        >
          EASY
        </button>
        <button 
          className="difficulty-btn normal-btn"
          onClick={() => handleDifficultySelect('normal')}
        >
          NORMAL
        </button>
        <button 
          className="difficulty-btn hard-btn"
          onClick={() => handleDifficultySelect('hard')}
        >
          HARD
        </button>
      </div>
    </div>
  );
};

export default LandingPage; 