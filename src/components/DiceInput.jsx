// src/components/DiceInput.jsx
import { useState } from "react";

export default function DiceInput({ onResolve }) {
  const [d6, setD6] = useState("");
  const [d10, setD10] = useState("");
  const [d20, setD20] = useState("");
  const [needsChaos, setNeedsChaos] = useState(false);
  const [error, setError] = useState("");

  function resetInputs() {
    setD6("");
    setD10("");
    setD20("");
    setNeedsChaos(false);
    setError("");
  }

  function validate() {
    const d6n = Number(d6);
    if (!Number.isInteger(d6n) || d6n < 1 || d6n > 6) {
      return "D6 must be a number between 1 and 6";
    }

    // D10 only matters for D6 = 3,4,5
    if ([3, 4, 5].includes(d6n)) {
      const d10n = Number(d10);
      if (!Number.isInteger(d10n) || d10n < 1 || d10n > 10) {
        return "D10 must be a number between 1 and 10";
      }
    }

    if (needsChaos) {
      const d20n = Number(d20);
      if (!Number.isInteger(d20n) || d20n < 1 || d20n > 20) {
        return "D20 must be a number between 1 and 20";
      }
    }

    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    const payload = {
      d6: Number(d6),
      d10: d10 ? Number(d10) : null,
      d20: needsChaos ? Number(d20) : null,
    };

    // For now, just send dice upward
    onResolve?.(payload, { setNeedsChaos, resetInputs });
  }

  return (
    <form className="dice-panel" onSubmit={handleSubmit}>
      <h3>Dice Input</h3>

      <div className="dice-row">
        <label>
          D6
          <input
            value={d6}
            onChange={(e) => setD6(e.target.value)}
            inputMode="numeric"
            placeholder="1–6"
          />
        </label>

        {[3, 4, 5].includes(Number(d6)) && (
          <label>
            D10
            <input
              value={d10}
              onChange={(e) => setD10(e.target.value)}
              inputMode="numeric"
              placeholder="1–10"
            />
          </label>
        )}

        {needsChaos && (
          <label>
            D20
            <input
              value={d20}
              onChange={(e) => setD20(e.target.value)}
              inputMode="numeric"
              placeholder="1–20"
            />
          </label>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit">
        {needsChaos ? "Resolve Chaos" : "Resolve Play"}
      </button>
    </form>
  );
}

