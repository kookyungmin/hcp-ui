import Link from "next/link";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { OauthButtons } from "@/features/auth/ui/oauth-buttons";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export default function SignInPage() {
  return (
    <AuthShell title="로그인" description="콘솔 접근을 위해 계정으로 로그인하세요.">
      <form className="space-y-4">
        <Input label="아이디 또는 이메일" name="identifier" placeholder="you@company.com" />
        <Input label="비밀번호" name="password" type="password" placeholder="••••••••" />

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            로그인 상태 유지
          </label>
          <Link href="/auth/recover" className="font-medium text-blue-700 hover:text-blue-800">
            아이디/비밀번호 찾기
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg">
          로그인
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
