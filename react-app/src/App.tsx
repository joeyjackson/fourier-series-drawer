import React from 'react';
import './App.css';
import FourierDrawer from './canvas/FourierDrawer';

export const REACT_APP_BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

function App() {
  return (
    <div className="App">
      <FourierDrawer />
    </div>
  );
}

export default App;
