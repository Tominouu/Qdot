"use client";

import { AlertTriangle, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthScreen } from "@/components/auth/auth-screen";
import { MIN_PASSWORD_LENGTH, validatePassword } from "@/components/auth/auth-validation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { getMe, signOut, signUp } from "@/lib/api/auth";
import { acceptInvitation, getInvitation, listWorkspaces } from "@/lib/api/workspaces";
import { clearSession, setSession } from "@/lib/auth/session";
import { useResource } from "@/lib/hooks/use-resource";
import { errorMessage } from "@/lib/i18n/errors";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils/format";
import { setActiveWorkspaceId } from "@/lib/workspace/store";
import type { InvitationPreview, User } from "@/types";

/**
 * /invite/:token. Existing users accept in one click (after signing in with the
 * invited address); new users create their account here and join directly.
 */
export function InvitationView({ token }: { token: string }) {
  const { t } = useI18n();
  const a = t.workspace.accept;
  const invitation = useResource(() => getInvitation(token), [token]);
  const me = useResource(getMe, []);

  if (invitation.error) {
    const code = invitation.error instanceof ApiError ? invitation.error.code : null;
    return <Problem text={code === "INVITATION_NOT_FOUND" || code === "NOT_FOUND" ? a.invalid : errorMessage(invitation.error, t)} />;
  }
  if (!invitation.data || me.loading) {
    return (
      <AuthScreen title=" " description=" ">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </AuthScreen>
    );
  }

  const inv = invitation.data;
  if (inv.status === "expired") return <Problem text={a.expired} />;
  if (inv.status === "accepted") return <Problem text={a.used} action={<ButtonLink href="/qr-codes" variant="neutral">{a.open}</ButtonLink>} />;
  if (inv.status !== "pending") return <Problem text={a.invalid} />;

  return <PendingInvitation token={token} inv={inv} user={me.data ?? null} />;
}

function Problem({ text, action }: { text: string; action?: ReactNode }) {
  const { t } = useI18n();
  return (
    // "Invitation" reads the same in English and French.
    <AuthScreen title="Invitation" description={text}>
      <span className="flex size-14 items-center justify-center rounded-full bg-surface text-warning" aria-hidden>
        <AlertTriangle className="size-6" />
      </span>
      {action ?? (
        <ButtonLink href="/" variant="neutral">
          {t.auth.signInView.backHome}
        </ButtonLink>
      )}
    </AuthScreen>
  );
}

function PendingInvitation({ token, inv, user }: { token: string; inv: InvitationPreview; user: User | null }) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const a = t.workspace.accept;
  const role = t.workspace.roles[inv.role];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = `/invite/${encodeURIComponent(token)}`;

  const enter = (workspaceId: string, name: string) => {
    setActiveWorkspaceId(workspaceId);
    toast(a.joined(name));
    router.push("/qr-codes");
  };

  const summary = (
    <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-5 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-raised text-fg-strong" aria-hidden>
        <Users className="size-5" />
      </span>
      <p className="text-sm font-semibold text-fg">{a.forEmail(inv.email)}</p>
      <p className="text-xs text-subtle">
        {t.workspace.roleHints[inv.role]} · {a.validUntil(formatDate(inv.expiresAt, locale))}
      </p>
    </div>
  );

  const errorBox = error && (
    <p role="alert" className="flex w-full items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      {error}
    </p>
  );

  // Signed in with the invited address: one click.
  if (user && user.email.toLowerCase() === inv.email) {
    return (
      <AuthScreen title={a.title(inv.workspaceName)} description={a.description(inv.invitedBy, role)}>
        {summary}
        {errorBox}
        <Button
          className="h-12 w-full md:h-[42px]"
          disabled={busy}
          leadingIcon={busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : undefined}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const ws = await acceptInvitation(token);
              enter(ws.id, ws.name);
            } catch (err) {
              setError(errorMessage(err, t));
              setBusy(false);
            }
          }}
        >
          {busy ? a.accepting : a.accept}
        </Button>
      </AuthScreen>
    );
  }

  // Signed in as someone else: the link is personal.
  if (user) {
    return (
      <AuthScreen title={a.title(inv.workspaceName)} description={a.wrongAccount(user.email)}>
        {summary}
        <Button
          variant="neutral"
          className="h-12 w-full md:h-[42px]"
          onClick={async () => {
            await signOut().catch(() => undefined);
            clearSession();
            setActiveWorkspaceId(null);
            window.location.reload();
          }}
        >
          {a.signOut}
        </Button>
      </AuthScreen>
    );
  }

  // Signed out, account exists: sign in, then come back here.
  if (inv.accountExists) {
    return (
      <AuthScreen title={a.title(inv.workspaceName)} description={a.description(inv.invitedBy, role)}>
        {summary}
        <ButtonLink href={`/sign-in?next=${encodeURIComponent(next)}`} className="h-12 w-full md:h-[42px]">
          {a.signIn}
        </ButtonLink>
      </AuthScreen>
    );
  }

  // No account yet: create it right here; the API joins the workspace in the same step.
  return <SignUpFromInvitation token={token} inv={inv} summary={summary} onJoined={enter} />;
}

function SignUpFromInvitation({
  token,
  inv,
  summary,
  onJoined,
}: {
  token: string;
  inv: InvitationPreview;
  summary: ReactNode;
  onJoined: (workspaceId: string, name: string) => void;
}) {
  const { t } = useI18n();
  const a = t.workspace.accept;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordError = touched ? validatePassword(password, "sign-up", t) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validatePassword(password, "sign-up", t)) return;
    setBusy(true);
    setError(null);
    try {
      setSession(await signUp({ email: inv.email, password, invitationToken: token }));
      const joined = (await listWorkspaces()).find((w) => w.name === inv.workspaceName && w.role === inv.role);
      if (joined) onJoined(joined.id, joined.name);
      else router.push("/qr-codes");
    } catch (err) {
      setError(errorMessage(err, t));
      setBusy(false);
    }
  };

  return (
    <AuthScreen title={a.title(inv.workspaceName)} description={a.description(inv.invitedBy, t.workspace.roles[inv.role])}>
      {summary}
      <form noValidate onSubmit={submit} className="flex w-full flex-col gap-4">
        <p className="text-sm text-muted">{a.createAccountHint}</p>
        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}
        <Field label={t.auth.email} labelClassName="text-[13px] font-medium text-muted">
          {(id) => <Input id={id} type="email" value={inv.email} readOnly disabled className="h-12 md:h-10" />}
        </Field>
        <Field
          label={t.auth.password}
          error={passwordError ?? undefined}
          hint={passwordError ? undefined : t.auth.minChars(MIN_PASSWORD_LENGTH)}
          labelClassName="text-[13px] font-medium text-muted"
        >
          {(id, describedBy) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              placeholder={t.auth.createPassword}
              value={password}
              disabled={busy}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={describedBy}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => password && setTouched(true)}
              className="h-12 md:h-10"
            />
          )}
        </Field>
        <Button
          type="submit"
          className="mt-2 h-12 w-full md:h-[42px]"
          disabled={busy}
          leadingIcon={busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : undefined}
        >
          {busy ? t.auth.creatingAccount : a.createAccount}
        </Button>
      </form>
    </AuthScreen>
  );
}
