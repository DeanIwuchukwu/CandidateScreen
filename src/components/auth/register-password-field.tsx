"use client";

import { Input } from "@/components/ui/input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { useState } from "react";

export function RegisterPasswordField() {
  const [password, setPassword] = useState("");

  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">Password</span>
      <Input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordStrength password={password} />
    </label>
  );
}
