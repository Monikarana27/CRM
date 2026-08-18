"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const PAYU_ENDPOINT = "https://test.payu.in/_payment"; // sandbox — swap to https://secure.payu.in/_payment for production

export default function PayuRedirectPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = PAYU_ENDPOINT;

    searchParams.forEach((value, key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting to secure payment...</p>
    </div>
  );
}