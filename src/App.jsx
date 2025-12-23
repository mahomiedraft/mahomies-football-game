// src/App.jsx
import { useMemo, useState } from "react";
import "./styles.css";
import FieldCanvas from "./canvas/FieldCanvas";
import DiceInput from "./components/DiceInput";
import { createInitialState } from "./engine/state";
import { resolvePlay } from "./engine/resolvePlay";

export default function App() {
  const initial = useMemo(() => createInitialState(), []);
  const [state, setState] = useState(initial);

  function handleResolve(dice, helpers) {
    const { newState, events } = resolvePlay(state, dice);

    // If engine requests chaos roll, pause here
    if (events.some((e) => e.type === "CHAOS_REQUIRED")) {
      helpers.setNeedsChaos(true);
      return;
    }

    setState(newState);
    helpers.resetInputs();
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Mahomies Football Game</h1>
        <p>Chefs vs NPC — Dice decide everything.</p>
      </header>

      <main className="main">
        <FieldCanvas state={state} />
        <DiceInput onResolve={handleResolve} />
      </main>
    </div>
  );
}
