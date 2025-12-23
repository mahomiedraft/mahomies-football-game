// src/App.jsx
import { useMemo, useState } from "react";
import "./styles.css";
import FieldCanvas from "./canvas/FieldCanvas";
import DiceInput from "./components/DiceInput";
import { createInitialState } from "./engine/state";

export default function App() {
  const initial = useMemo(() => createInitialState(), []);
  const [state, setState] = useState(initial);

  function handleResolve(dice, helpers) {
    // TEMP wiring (until resolvePlay engine exists):
    // - If D6 === 1, we simulate "chaos triggered" to prove the D20 prompt works.
    // - Otherwise just log and clear inputs.
    console.log("Dice entered:", dice);

    if (dice.d6 === 1 && !dice.d20) {
      helpers.setNeedsChaos(true);
      return;
    }

    // Small demo: move ball forward a bit when you resolve a non-sack
    // (This will be replaced by real engine logic soon.)
    if (!dice.d20 && dice.d6 !== 1) {
      setState((prev) => ({
        ...prev,
        game: { ...prev.game, ballOn: Math.min(100, prev.game.ballOn + 3) },
      }));
    }

    helpers.resetInputs();
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Mahomies Football Game</h1>
        <p>Chefs (Red/White) vs NPC — dice-in, pixels-out.</p>
      </header>

      <main className="main">
        <FieldCanvas state={state} />
        <DiceInput onResolve={handleResolve} />
      </main>
    </div>
  );
}
