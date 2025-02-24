import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../css/Profile.css';

function Profile() {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const fileInputRef = useRef(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const startEdit = (field, currentValue) => {
    setEditField(field);
    setTempValue(currentValue || '');
  };

  const saveEdit = async (field) => {
    if (tempValue.trim()) {
      try {
        await updateUser({ [field]: field === 'wallet' ? parseFloat(tempValue) : tempValue });
        console.log(`Updated ${field} to:`, tempValue);
      } catch (err) {
        alert(`Failed to update ${field}: ${err.message}`);
        console.error('Save Edit Error:', err);
      }
    }
    setEditField(null);
    setTempValue('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoData = reader.result;
        try {
          await updateUser({ photo: photoData });
          console.log('Photo updated to:', photoData.slice(0, 50) + '...');
        } catch (err) {
          alert('Failed to update photo: ' + err.message);
          console.error('Photo Upload Error:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMoney = async () => {
    const amount = prompt('Enter amount to add:');
    if (amount && !isNaN(amount)) {
      try {
        await updateUser({ wallet: (user.wallet || 0) + parseFloat(amount) });
        console.log('Wallet updated with added amount:', amount);
      } catch (err) {
        alert('Failed to add money: ' + err.message);
      }
    }
  };

  const handleWithdraw = async () => {
    const amount = prompt('Enter amount to withdraw:');
    if (amount && !isNaN(amount)) {
      const withdrawAmount = parseFloat(amount);
      if (withdrawAmount <= (user.wallet || 0)) {
        try {
          await updateUser({ wallet: (user.wallet || 0) - withdrawAmount });
          console.log('Wallet updated with withdrawn amount:', withdrawAmount);
        } catch (err) {
          alert('Failed to withdraw money: ' + err.message);
        }
      } else {
        alert('Insufficient funds!');
      }
    }
  };

  const recentActivity = [
    { id: 1, action: 'Predicted Conor vs. Khabib', date: '2025-02-22' },
    { id: 2, action: 'Added $50 to wallet', date: '2025-02-21' },
  ];

  return (
    <div className={`Profile ${theme}`}>
      <div className="profile-header">
        <div className="pic-container">
          <img src={user.photo || 'https://via.placeholder.com/150'} alt="Profile" />
          <span className="edit-icon" onClick={() => fileInputRef.current.click()}>✏️</span>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        <h2>{user.username}</h2>
      </div>

      <div className="profile-details">
        <div className="profile-field">
          <label>Email</label>
          {editField === 'email' ? (
            <div className="edit-input">
              <input
                type="email"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder="Enter your email"
                autoFocus
              />
              <button onClick={() => saveEdit('email')}>Save</button>
            </div>
          ) : (
            <p>
              {user.email || 'Not set'}
              <span className="edit-icon field-edit-icon" onClick={() => startEdit('email', user.email)}>✏️</span>
            </p>
          )}
        </div>

        <div className="profile-field">
          <label>Phone</label>
          {editField === 'phone' ? (
            <div className="edit-input">
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder="Enter your phone"
                autoFocus
              />
              <button onClick={() => saveEdit('phone')}>Save</button>
            </div>
          ) : (
            <p>
              {user.phone || 'Not set'}
              <span className="edit-icon field-edit-icon" onClick={() => startEdit('phone', user.phone)}>✏️</span>
            </p>
          )}
        </div>

        <div className="profile-field">
          <label>Wallet</label>
          <p>${(user.wallet || 0).toFixed(2)}</p>
          <div className="wallet-actions">
            <button onClick={handleAddMoney}>Add Money</button>
            <button onClick={handleWithdraw}>Withdraw</button>
          </div>
        </div>

        <div className="profile-field">
          <label>Joined</label>
          <p>{user.joined}</p>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        {recentActivity.length ? (
          <ul>
            {recentActivity.map((activity) => (
              <li key={activity.id}>{activity.action} - {activity.date}</li>
            ))}
          </ul>
        ) : (
          <p>No recent activity.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;