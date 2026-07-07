"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Leaf, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { redirectPathForRole } from "@/lib/auth-redirect";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error) {
      toast.error(t.auth.errors.oauth);
    }
  }, [t.auth.errors.oauth]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput, redirectTo?: string) => {
    setLoading(true);
    const result = await signIn("credentials", {
      email: values.email.trim().toLowerCase(),
      password: values.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error(t.auth.errors.invalid);
      return;
    }

    const session = await getSession();
    const destination = redirectTo || redirectPathForRole(session?.user?.role);

    toast.success(t.auth.loginTitle);
    router.push(destination);
    router.refresh();
  };

  const loginAs = async (
    email: string,
    password: string,
    redirectTo?: string
  ) => {
    form.setValue("email", email);
    form.setValue("password", password);
    await onSubmit({ email, password }, redirectTo);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md glass-card border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{t.auth.loginTitle}</CardTitle>
          <CardDescription>{t.app.tagline}</CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthButtons callbackUrl="/dashboard" disabled={loading} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t.auth.email}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.auth.email}</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.auth.password}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.nav.login}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {t.auth.noAccount}{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              {t.nav.register}
            </Link>
          </p>

          <div className="mt-6 p-4 rounded-xl bg-muted/50 text-xs space-y-3">
            <p className="font-medium">{t.profile.demoAccount}</p>
            <p>{t.profile.demoEmail} · {t.profile.demoPassword}</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => loginAs("demo@plantcare.ir", "demo1234", "/dashboard")}
              >
                {t.profile.useDemo}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => loginAs("admin@plantcare.ir", "admin1234", "/admin")}
              >
                {t.profile.useAdmin}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => loginAs("expert@plantcare.ir", "expert1234", "/expert")}
              >
                {t.profile.useExpert}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
