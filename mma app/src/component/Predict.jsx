import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import FighterCard from './FighterCard';

function Predict() {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [fights, setFights] = useState([]);
  const [winner, setWinner] = useState({});
  const [odds, setOdds] = useState({});
  const [userChoices, setUserChoices] = useState({});
  const [betAmounts, setBetAmounts] = useState({});
  const [betResults, setBetResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFights = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:5000/api/fights', { credentials: 'include' });
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error(`Failed to fetch fights: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setFights(data);
        const initialOdds = {};
        const initialChoices = {};
        const initialAmounts = {};
        const initialResults = {};
        data.forEach((fight) => {
          const fightId = fight.id;
          initialOdds[fightId] = { fighter1: 50, fighter2: 50 };
          initialChoices[fightId] = '';
          initialAmounts[fightId] = '';
          initialResults[fightId] = '';
        });
        setOdds(initialOdds);
        setUserChoices(initialChoices);
        setBetAmounts(initialAmounts);
        setBetResults(initialResults);
      } catch (err) {
        console.error('Error fetching fights:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFights();
  }, [navigate]);

  const calculateOddsForFight = (fightId, fighter1, fighter2) => {
    if (!user) {
      alert('Please log in to predict outcomes.');
      navigate('/login');
      return;
    }
    const score1 = fighter1.wins * 0.15 + fighter1.kos * 0.2 + fighter1.height * 0.1 + fighter1.takedowns * 0.15 + fighter1.submissions * 0.15 + fighter1.strikingAccuracy * 0.05 + fighter1.reach * 0.1 + fighter1.weight * 0.05;
    const score2 = fighter2.wins * 0.15 + fighter2.kos * 0.2 + fighter2.height * 0.1 + fighter2.takedowns * 0.15 + fighter2.submissions * 0.15 + fighter2.strikingAccuracy * 0.05 + fighter2.reach * 0.1 + fighter2.weight * 0.05;
    const totalScore = score1 + score2;
    const odds1 = Math.round((score1 / totalScore) * 100);
    const odds2 = 100 - odds1;
    setOdds(prev => ({
      ...prev,
      [fightId]: { fighter1: odds1, fighter2: odds2 }
    }));
    setWinner(prev => ({
      ...prev,
      [fightId]: score1 > score2 ? fighter1.name : fighter2.name
    }));
    setBetResults(prev => ({ ...prev, [fightId]: '' }));
  };

  const handleBet = async (fightId) => {
    if (!user) {
      alert('Please log in to place a bet.');
      navigate('/login');
      return;
    }
    const choice = userChoices[fightId];
    const amount = betAmounts[fightId];
    if (!choice || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Please select a fighter and enter a valid bet amount');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/auth/place-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fightId, fighterChoice: choice, amount: parseFloat(amount) }),
      });
      if (!response.ok) throw new Error('Bet failed');
      const data = await response.json();
      setBetResults(prev => ({
        ...prev,
        [fightId]: data.message
      }));
      setBetAmounts(prev => ({ ...prev, [fightId]: '' }));
      setUserChoices(prev => ({ ...prev, [fightId]: '' }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className={`Predict ${theme}`}>Loading fights...</div>;
  if (error) return <div className={`Predict ${theme}`}>Error: {error}</div>;

  return (
    <div className={`Predict ${theme}`}>
      {fights.map((fight) => (
        <div key={fight.id} className="fight-container">
          <div className="fighter-section">
            <FighterCard fighter={fight.fighter1} />
            <div className="odds">
              <p>Odds: {odds[fight.id]?.fighter1 || 50}%</p>
              <p>{odds[fight.id]?.fighter1 > odds[fight.id]?.fighter2 ? 'Favorite' : 'Underdog'}</p>
            </div>
          </div>
          <div className="vs">VS</div>
          <div className="fighter-section">
            <FighterCard fighter={fight.fighter2} />
            <div className="odds">
              <p>Odds: {odds[fight.id]?.fighter2 || 50}%</p>
              <p>{odds[fight.id]?.fighter2 > odds[fight.id]?.fighter1 ? 'Favorite' : 'Underdog'}</p>
            </div>
          </div>
          <div className="predict-actions">
            <button onClick={() => calculateOddsForFight(fight.id, fight.fighter1, fight.fighter2)} disabled={!user}>
              Predict
            </button>
            <div className="bet-section">
              <label>
                Select Fighter to Bet On:
                <div>
                  <input
                    type="radio"
                    name={`fighter-${fight.id}`}
                    value={fight.fighter1.name}
                    checked={userChoices[fight.id] === fight.fighter1.name}
                    onChange={(e) => setUserChoices(prev => ({ ...prev, [fight.id]: e.target.value }))}
                    disabled={!user}
                  />
                  {fight.fighter1.name}
                </div>
                <div>
                  <input
                    type="radio"
                    name={`fighter-${fight.id}`}
                    value={fight.fighter2.name}
                    checked={userChoices[fight.id] === fight.fighter2.name}
                    onChange={(e) => setUserChoices(prev => ({ ...prev, [fight.id]: e.target.value }))}
                    disabled={!user}
                  />
                  {fight.fighter2.name}
                </div>
              </label>
              <input
                type="number"
                placeholder="Bet Amount"
                value={betAmounts[fight.id] || ''}
                onChange={(e) => setBetAmounts(prev => ({ ...prev, [fight.id]: e.target.value }))}
                style={{ margin: '10px 0', padding: '8px', width: '100px' }}
                disabled={!user}
              />
              <button onClick={() => handleBet(fight.id)} disabled={!user}>Bet</button>
            </div>
            {winner[fight.id] && <h3>Predicted Winner: {winner[fight.id]}</h3>}
            {betResults[fight.id] && <p className="bet-result">{betResults[fight.id]}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Predict;