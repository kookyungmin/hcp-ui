import Link from "next/link";
import { AuthShell } from "@/features/auth/ui/auth-shell";
import { Button } from "@/shared/ui/button";

export default function UnauthorizedPage() {
  return (
    <AuthShell
      title="접근 권한이 없습니다"
      description="요청한 리소스에 접근할 권한이 없습니다. 관리자에게 권한을 요청하세요."
    >
      <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">RBAC 정책 안내</p>
        <p>현재 계정에는 해당 프로젝트의 읽기/쓰기 권한이 할당되어 있지 않습니다.</p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/auth/sign-in" className="flex-1">
          <Button type="button" variant="secondary" fullWidth>
            다른 계정으로 로그인
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button type="button" fullWidth>
            메인으로 이동
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}
