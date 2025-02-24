import { useState } from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Header from './component/Header';
import FighterCard from './component/FighterCard';
import Login from './component/Login';
import Register from './component/Register'; // New import
import Footer from './component/Footer';
import Gallery from './component/Gallery';
import Profile from './component/Profile';

function InnerApp() {
  const { theme } = useTheme();
  const [winner, setWinner] = useState('');
  const [odds, setOdds] = useState({ fighterA: 50, fighterB: 50 });

  const fighterA = {
    name: 'Conor McGregor',
    wins: 22,
    kos: 19,
    height: 69,
    takedowns: 1,
    submissions: 1,
    strikingAccuracy: 49,
    reach: 74,
    weight: 155,
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Conor_McGregor_2018.jpg/320px-Conor_McGregor_2018.jpg'
  };
  const fighterB = {
    name: 'Khabib Nurmagomedov',
    wins: 29,
    kos: 8,
    height: 70,
    takedowns: 59,
    submissions: 11,
    strikingAccuracy: 47,
    reach: 70,
    weight: 155,
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Khabib_Nurmagomedov.png/320px-Khabib_Nurmagomedov.png'
  };

  const calculateOdds = () => {
    const scoreA = fighterA.wins * 0.15 + fighterA.kos * 0.2 + fighterA.height * 0.1 + fighterA.takedowns * 0.15 + fighterA.submissions * 0.15 + fighterA.strikingAccuracy * 0.05 + fighterA.reach * 0.1 + fighterA.weight * 0.05;
    const scoreB = fighterB.wins * 0.15 + fighterB.kos * 0.2 + fighterB.height * 0.1 + fighterB.takedowns * 0.15 + fighterB.submissions * 0.15 + fighterB.strikingAccuracy * 0.05 + fighterB.reach * 0.1 + fighterB.weight * 0.05;
    const totalScore = scoreA + scoreB;
    const oddsA = Math.round((scoreA / totalScore) * 100);
    const oddsB = 100 - oddsA;
    setOdds({ fighterA: oddsA, fighterB: oddsB });
    setWinner(scoreA > scoreB ? fighterA.name : fighterB.name);
  };

  const placeBet = () => {
    alert('Betting feature coming soon!');
  };

  return (
    <div className={`App ${theme}`}>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <div className="fight-container">
              <div className="fighter-section">
                <FighterCard fighter={fighterA} />
                <div className="odds">
                  <p>Odds: {odds.fighterA}%</p>
                  <p>{odds.fighterA > odds.fighterB ? 'Favorite' : 'Underdog'}</p>
                </div>
              </div>
              <div className="vs">VS</div>
              <div className="fighter-section">
                <FighterCard fighter={fighterB} />
                <div className="odds">
                  <p>Odds: {odds.fighterB}%</p>
                  <p>{odds.fighterB > odds.fighterA ? 'Favorite' : 'Underdog'}</p>
                </div>
              </div>
              <div className="buttons">
                <button onClick={calculateOdds}>Predict</button>
                <button onClick={placeBet}>Bet</button>
              </div>
              {winner && <h3>Predicted Winner: {winner}</h3>}
            </div>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* New route */}
        <Route path="/news" element={<Gallery />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <InnerApp />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;