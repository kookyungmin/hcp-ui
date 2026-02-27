"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { OauthButtons } from "@/features/auth/ui/oauth-buttons";
import { useAuthStore } from "@/shared/stores/auth.store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

export default function SignInPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isFormValid = useMemo(() => {
    return email.length > 0 && password.length > 0 && !emailError && !passwordError;
  }, [email, password, emailError, passwordError]);

  const validate = () => {
    let valid = true;

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("올바른 이메일 형식을 입력해 주세요.");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError("비밀번호는 대문자/소문자를 포함해 8자 이상이어야 합니다.");
      valid = false;
    } else {
      setPasswordError("");
    }

    return valid;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (value.length === 0) {
      setEmailError("");
      return;
    }

    if (/^\S+@\S+\.\S+$/.test(value)) {
      setEmailError("");
    } else {
      setEmailError("올바른 이메일 형식을 입력해 주세요.");
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (value.length === 0) {
      setPasswordError("");
      return;
    }

    if (PASSWORD_REGEX.test(value)) {
      setPasswordError("");
    } else {
      setPasswordError("비밀번호는 대문자/소문자를 포함해 8자 이상이어야 합니다.");
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const ok = await login(email, password);
    if (ok) {
      router.push("/");
    }
  };

  return (
    <AuthShell title="로그인" description="콘솔 접근을 위해 계정으로 로그인하세요.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="이메일(ID)"
          name="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => handleEmailChange(event.target.value)}
          error={emailError}
        />
        <Input
          label="비밀번호"
          name="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => handlePasswordChange(event.target.value)}
          error={passwordError}
          hint="대문자/소문자 포함 8자 이상"
        />

        <div className="flex items-center justify-end text-sm">
          <Link href="/auth/recover" className="font-medium text-blue-700 hover:text-blue-800">
            아이디/비밀번호 찾기
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" disabled={!isFormValid || isLoggingIn}>
          {isLoggingIn ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-500">또는</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <OauthButtons />

      <p className="pt-6 text-center text-sm text-slate-600">
        계정이 없으신가요?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-blue-700 hover:text-blue-800">
          회원가입
        </Link>
      </p>
    </AuthShell>
  );
}
