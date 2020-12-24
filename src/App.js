import logo from "./logo.svg";
import "./App.css";
import styled from "styled-components";
import { useState } from "react";

import Game from "./Game";

const App = () => {
  return (
    <div>
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <Game />
    </div>
  );
};

export default App;
