import { useEffect, useRef } from "react";

export function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
        const charArray = characters.split("");
        const fontSize = 14;
        const columns = Math.ceil(canvas.width / fontSize);

        const drops: number[] = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        const draw = () => {
            // Create translucent background to generate trails
            ctx.fillStyle = "rgba(10, 10, 10, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#39FF14"; // Neon green
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                // Add subtle variation to character appearance
                if (Math.random() > 0.95) {
                    ctx.fillStyle = "#ffffff";
                } else {
                    ctx.fillStyle = "#39FF14";
                }

                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Recompute columns and reset drops arrays if the window changes size
            const newColumns = Math.ceil(canvas.width / fontSize);
            drops.length = 0;
            for (let x = 0; x < newColumns; x++) {
                drops[x] = Math.random() * canvas.height; // scatter them randomly on resize
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none opacity-[0.15] z-0"
            aria-hidden="true"
        />
    );
}
