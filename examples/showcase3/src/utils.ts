export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function calculateProgress(timeLeft: number, totalTime: number): number {
  return ((totalTime - timeLeft) / totalTime) * 100;
}

export function createProgressRingSVG(progress: number, color: string): string {
  const radius = 120;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return `
    <svg height="${radius * 2}" width="${radius * 2}" class="transform -rotate-90">
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        stroke-width="${stroke}"
        r="${normalizedRadius}"
        cx="${radius}"
        cy="${radius}"
      />
      <circle
        class="progress-ring"
        stroke="${color}"
        fill="transparent"
        stroke-width="${stroke}"
        stroke-linecap="round"
        stroke-dasharray="${circumference} ${circumference}"
        stroke-dashoffset="${strokeDashoffset}"
        r="${normalizedRadius}"
        cx="${radius}"
        cy="${radius}"
      />
    </svg>
  `;
}
