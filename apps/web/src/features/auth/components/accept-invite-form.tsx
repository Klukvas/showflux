"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "@/hooks/use-form";
import { api, setAccessToken } from "@/lib/api-client";
import { endpoints } from "@/lib/api-endpoints";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  strongPassword,
  compose,
  minLength,
  maxLength,
} from "@/lib/validators";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import type { AuthResponse } from "@/types/auth";

interface AcceptInviteFormProps {
  readonly token: string;
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter();

  const form = useForm({
    initialValues: { fullName: "", password: "" },
    validators: {
      fullName: compose(minLength("Full name", 2), maxLength("Full name", 100)),
      password: strongPassword,
    },
    onSubmit: async (values) => {
      const res = await api.post<AuthResponse>(
        endpoints.invites.accept(token),
        {
          fullName: values.fullName,
          password: values.password,
        },
      );
      setAccessToken(res.accessToken);
      document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;
      router.push("/dashboard");
    },
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Accept Invitation
        </h2>
        <form onSubmit={form.handleSubmit} className="space-y-4">
          {form.serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {form.serverError}
            </div>
          )}
          <Input
            label="Full Name"
            autoComplete="name"
            value={form.values.fullName}
            onChange={(e) => form.setValue("fullName", e.target.value)}
            onBlur={() => form.handleBlur("fullName")}
            error={form.errors.fullName}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.values.password}
            onChange={(e) => form.setValue("password", e.target.value)}
            onBlur={() => form.handleBlur("password")}
            error={form.errors.password}
          />
          <Button
            type="submit"
            isLoading={form.isSubmitting}
            className="w-full"
          >
            Join Workspace
          </Button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
