import { useEffect, useRef } from "react";
import { drawStadium } from "./drawField";

export default function FieldCanvas({ state }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const user = state?.teams?.USER;
    const npc = state?.teams?.NPC;

    drawStadium(ctx, canvas, {
      userTeamName: user?.name ?? "CHEFS",
      npcTeamName: npc?.name ?? "NPC",
      userColors: user?.colors ?? { primary: "#C8102E", secondary: "#FFFFFF" },
      npcColors: npc?.colors ?? { primary: "#2D6CDF", secondary: "#E6E6E6" },
      ballOn: state?.game?.ballOn ?? 25,
    });
  }, [state]);

  return (
    <div style={{ width: "100%", maxWidth: 980 }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          imageRendering: "pixelated",
          background: "#000",
          display: "block",
        }}
      />
    </div>
  );
}
