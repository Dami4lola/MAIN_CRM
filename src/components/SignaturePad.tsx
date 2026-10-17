import { useEffect, useRef, type PointerEvent } from "react";

/** A finger- or mouse-drawn signature. Reports a PNG data URL after each stroke, or null when cleared. */
function SignaturePad({ onChange }: { onChange: (signature: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    element.width = element.clientWidth || 440;
    element.height = element.clientHeight || 150;
    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#1c2634";
  }, []);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * event.currentTarget.width, ((event.clientY - rect.top) / rect.height) * event.currentTarget.height] as const;
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const [x, y] = point(event);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 0.1, y + 0.1);
    context.stroke();
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d");
    const [x, y] = point(event);
    context?.lineTo(x, y);
    context?.stroke();
  }

  function end(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(event.currentTarget.toDataURL("image/png"));
  }

  function clear() {
    const element = canvas.current;
    element?.getContext("2d")?.clearRect(0, 0, element.width, element.height);
    onChange(null);
  }

  return (
    <div className="signature-pad">
      <canvas ref={canvas} aria-label="Signature area" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
      <div className="signature-foot">
        <span>Sign above</span>
        <button type="button" className="inline-link" onClick={clear}>Clear</button>
      </div>
    </div>
  );
}

export default SignaturePad;
