import logo from './logo.svg';
import './App.css';
import { useEffect } from 'react';
import React, {useState} from 'react';


function App() {
  const[message, setMessage] = useState('');
  useEffect(() => {
    fetch('http://127.0.0.1:5000/')
    .then((response) => response.json)
    .then((data) => setMessage(data.message))
    .catch((error) => console.error("Error: ", error))
  }, []);
  return (
    <div className="App">
      <h1>{message ? message: 'Hello World'} </h1>
    </div>
  );
}

export default App;
