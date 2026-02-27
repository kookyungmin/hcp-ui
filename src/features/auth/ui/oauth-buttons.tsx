import { Button } from "@/shared/ui/button";

const providers = ["Google"];

export function OauthButtons() {
  return (
    <div className="space-y-2">
      {providers.map((provider) => (
        <Button key={provider} type="button" variant="secondary" fullWidth>
          {provider}로 계속하기
        </Button>
      ))}
    </div>
  );
}
