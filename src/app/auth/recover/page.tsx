import { AuthShell } from "@/features/auth/ui/auth-shell";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export default function RecoverPage() {
  return (
    <AuthShell
      title="아이디/비밀번호 찾기"
      description="가입한 이메일 또는 계정 정보로 인증 후 복구 링크를 받을 수 있습니다."
    >
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-sm">
        <button type="button" className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm">
          아이디 찾기
        </button>
        <button type="button" className="rounded-lg px-3 py-2 font-medium text-slate-600">
          비밀번호 재설정
        </button>
      </div>

      <form className="space-y-4">
        <Input label="이름" name="name" placeholder="홍길동" />
        <Input label="가입 이메일" name="email" type="email" placeholder="you@company.com" />
        <Button type="submit" fullWidth size="lg">
          인증 메일 보내기
        </Button>
      </form>
    </AuthShell>
  );
}
