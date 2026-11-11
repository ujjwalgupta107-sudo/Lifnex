import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';
import '../static/css/variables.css';
import '../static/css/base.css';
import '../static/css/components.css';
import '../static/css/layout.css';
import '../static/css/dashboards.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

