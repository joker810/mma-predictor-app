import React from 'react';
import { useTheme } from '../context/ThemeContext';
import '../css/FighterCard.css';

function FighterCard({ fighter }) {
  // Map fighter names to local image paths (adjust based on actual file names)
  const imageMap = {
    'Conor McGregor': '/images/320px-Conor_McGregor_2018.jpg',
    'Khabib Nurmagomedov': '/images/320px-Khabib_Nurmagomedov.jpg',
    'Jon Jones': '/images/jon-jones.jpg',
    'Daniel Cormier': '/images/daniel-cormier.jpg',
  };

  const { theme } = useTheme();
  console.log('Current theme and photo URL in FighterCard:', theme, fighter.name, imageMap[fighter.name]); // Debug image paths and theme

  const photoUrl = imageMap[fighter.name] || '/images/default-fighter.webp'; // Fallback image

  return (
    <div className={`FighterCard-wrapper ${theme}`}>
      <div className="FighterCard" style={{ backgroundImage: `url(${photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <div className="card-overlay">
          <div className="fighter-info">
            <h2 className="fighter-name">{fighter.name}</h2>
            <div className="main-stats">
              <p>Wins/Losses: {fighter.wins}/{10}</p> {/* Placeholder for losses—update if real data exists */}
              <p>KOs: {fighter.kos}</p>
              <p>Odds: 50%</p> {/* Update with dynamic odds if needed */}
            </div>
            <div className="extra-stats">
              <p>Height: {fighter.height} in</p>
              <p>Takedowns: {fighter.takedowns}</p>
              <p>Submissions: {fighter.submissions}</p>
              <p>Striking Accuracy: {fighter.strikingAccuracy}%</p>
              <p>Reach: {fighter.reach} in</p>
              <p>Weight: {fighter.weight} lbs</p>
            </div>
          </div>
          <div className="neon-border"></div>
        </div>
      </div>
    </div>
  );
}

export default FighterCard;