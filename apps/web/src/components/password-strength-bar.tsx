"use client";

import { useMemo } from "react";

interface PasswordStrengthBarProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels: { label: string; color: string }[] = [
    { label: "Muy debil", color: "bg-red-500" },
    { label: "Debil", color: "bg-orange-500" },
    { label: "Aceptable", color: "bg-yellow-500" },
    { label: "Fuerte", color: "bg-emerald-500" },
    { label: "Muy fuerte", color: "bg-emerald-600" },
  ];

  const index = Math.min(score, levels.length) - 1;
  const level = levels[Math.max(0, index)] ?? levels[0]!;
  return { score, label: level.label, color: level.color };
}

export default function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { score, label, color } = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
