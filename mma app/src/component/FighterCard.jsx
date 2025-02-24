import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../css/FighterCard.css';

function FighterCard({ fighter }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="FighterCard-wrapper">
      <div
        className={`FighterCard ${isExpanded ? 'expanded' : ''} ${theme}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <img src={fighter.photo} alt={fighter.name} className="fighter-photo" />
        <h2>{fighter.name}</h2>
        <div className="stats">
          <p>Wins: {fighter.wins}</p>
          <p>KOs: {fighter.kos}</p>
          <div className="extra-stats">
            <p>Height: {fighter.height} in</p>
            <p>Takedowns: {fighter.takedowns}</p>
            <p>Submissions: {fighter.submissions}</p>
            <p>Striking Accuracy: {fighter.strikingAccuracy}%</p>
            <p>Reach: {fighter.reach} in</p>
            <p>Weight: {fighter.weight} lbs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FighterCard;