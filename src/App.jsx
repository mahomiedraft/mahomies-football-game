// src/App.jsx
import { useMemo } from "react";
import "./styles.css";
import FieldCanvas from "./canvas/FieldCanvas";
import { createInitialState } from "./engine/state";

export default function App() {
  const state = useMemo(() => createInitialState(), []);

  return (
    <div className="app">
      <header className="header">
        <h1>Mahomies Football Game</h1>
        <p>Dice-in, pixels-out. The Chefs are hungry.</p>
      </header>

      <main className="main">
        <FieldCanvas state={state} />
      </main>
    </div>
  );
}

