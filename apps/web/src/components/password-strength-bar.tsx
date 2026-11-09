const LEVELS = [
  { label: "Muy débil", color: "bg-clash" },
  { label: "Débil", color: "bg-clash" },
  { label: "Aceptable", color: "bg-warn" },
  { label: "Fuerte", color: "bg-good" },
  { label: "Muy fuerte", color: "bg-good" },
];

function scorePassword(password: string) {
  const checks = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  return checks.filter(Boolean).length;
}

export default function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;

  const score = scorePassword(password);
  const level = LEVELS[Math.max(score - 1, 0)]!;

  return (
    <div className="space-y-1.5">
      <div aria-hidden="true" className="flex gap-1">
        {LEVELS.map(({ label }, index) => (
          <span key={label} className={`h-1 flex-1 transition-colors ${index < score ? level.color : "bg-muted"}`} />
        ))}
      </div>
      <p aria-live="polite" className="text-[13px] text-muted-foreground">
        {level.label}
      </p>
    </div>
  );
}
