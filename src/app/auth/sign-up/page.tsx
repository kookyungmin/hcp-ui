import Link from "next/link";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export default function SignUpPage() {
  return (
    <AuthShell title="회원가입" description="클라우드 콘솔 사용을 위한 조직 계정을 생성하세요.">
      <form className="space-y-4">
        <Input label="닉네임" name="name" placeholder="홍길동" />
        <Input label="이메일" name="email" type="email" placeholder="you@company.com" />
        <Input label="비밀번호" name="password" type="password" placeholder="8자 이상 입력" hint="영문, 숫자, 특수문자 조합 권장" />
        <Input label="비밀번호 확인" name="passwordConfirm" type="password" placeholder="비밀번호 재입력" />

        <label className="inline-flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300" />
          서비스 이용약관 및 개인정보 처리방침에 동의합니다.
        </label>

        <Button type="submit" fullWidth size="lg">
          회원가입 완료
        </Button>
      </form>

      <p className="pt-6 text-center text-sm text-slate-600">
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-blue-700 hover:text-blue-800">
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}
