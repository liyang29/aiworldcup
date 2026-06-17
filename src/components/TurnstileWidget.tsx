'use client';

import Script from 'next/script';

// Cloudflare Turnstile：放在 <form> 内，验证通过后会自动注入
// 隐藏输入 name="cf-turnstile-response"，随表单提交到服务端校验。
export default function TurnstileWidget({ siteKey }: { siteKey: string }) {
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" />
    </>
  );
}
