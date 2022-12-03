import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// disable console.log on production
if (!import.meta.env.DEV) {
  console.log = function(){
    return;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
