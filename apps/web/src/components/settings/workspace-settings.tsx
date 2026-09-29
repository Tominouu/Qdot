"use client";

import { AlertTriangle, Copy, Link2, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copyText } from "@/components/ui/copy-button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import {
  createInvitation,
  deleteWorkspace,
  listInvitations,
  listMembers,
  removeMember,
  revokeInvitation,
  transferOwnership,
  updateMemberRole,
  updateWorkspace,
} from "@/lib/api/workspaces";
import { useResource } from "@/lib/hooks/use-resource";
import { errorMessage } from "@/lib/i18n/errors";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils/format";
import { useWorkspace } from "@/lib/workspace/provider";
import { getSession } from "@/lib/auth/session";
import { ASSIGNABLE_ROLES, ROLE_RANK, type AssignableRole, type WorkspaceMember, type WorkspaceRole } from "@/types";

function Section({ title, description, children, tone }: { title: string; description: string; children: ReactNode; tone?: "danger" }) {
  return (
    <section className={tone === "danger" ? "flex flex-col gap-4 rounded-2xl border border-danger/40 p-5 md:p-6" : "flex flex-col gap-4"}>
      <div className="flex flex-col gap-1">
        <h2 className={`font-display text-lg font-extrabold ${tone === "danger" ? "text-danger" : "text-fg"}`}>{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Confirm({ open, title, text, confirmLabel, onClose, onConfirm, danger }: { open: boolean; title: string; text: string; confirmLabel: string; onClose: () => void; onConfirm: () => Promise<void>; danger?: boolean }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted">{text}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t.common.cancel}
        </Button>
        <Button
          variant={danger ? "destructive" : "primary"}
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/** Settings → Workspace: General, Members & invitations, Danger zone. */
export function WorkspaceSettings({ membersOnly }: { membersOnly?: boolean }) {
  const { current } = useWorkspace();
  const { t } = useI18n();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] leading-tight font-black text-fg md:text-[32px]">{membersOnly ? t.workspace.members.title : current.name}</h1>
        <p className="text-[15px] text-muted">
          {t.workspace.roles[current.role]} · {t.workspace.memberCount(current.memberCount)}
        </p>
      </div>
      {!membersOnly && <GeneralSection />}
      <MembersSection />
      {!membersOnly && <DangerZone />}
    </div>
  );
}

function GeneralSection() {
  const { current, can, reload } = useWorkspace();
  const { t } = useI18n();
  const { toast } = useToast();
  const g = t.workspace.general;
  const [name, setName] = useState(current.name);
  const [slug, setSlug] = useState(current.slug);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const editable = can("workspace:update");
  const dirty = name.trim() !== current.name || slug.trim() !== current.slug;

  return (
    <Section title={g.title} description={editable ? g.description : g.ownerOnly}>
      <form
        className="flex max-w-xl flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErrors({});
          try {
            await updateWorkspace({ name: name.trim(), slug: slug.trim().toLowerCase() });
            await reload();
            toast(g.saved);
          } catch (err) {
            if (err instanceof ApiError && err.fields) setErrors(err.code === "SLUG_TAKEN" ? { slug: errorMessage(err, t) } : err.fields);
            else toast(errorMessage(err, t), "warning");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={g.name} error={errors.name}>
          {(id, d) => <Input id={id} aria-describedby={d} value={name} maxLength={60} disabled={!editable} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label={g.slug} error={errors.slug} hint={errors.slug ? undefined : t.workspace.create.slugHint}>
          {(id, d) => <Input id={id} aria-describedby={d} value={slug} maxLength={48} disabled={!editable} onChange={(e) => setSlug(e.target.value.toLowerCase())} />}
        </Field>
        {editable && (
          <Button type="submit" size="sm" className="self-start" disabled={busy || !dirty || !name.trim()}>
            {busy ? t.common.saving : g.save}
          </Button>
        )}
      </form>
    </Section>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

function MembersSection() {
  const { current, can, reload } = useWorkspace();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const m = t.workspace.members;
  const members = useResource(listMembers, [current.id]);
  const manage = can("members:manage");
  const invitations = useResource(() => (manage ? listInvitations() : Promise.resolve([])), [current.id, manage]);
  const meId = getSession()?.user.id;
  const myRank = ROLE_RANK[current.role];
  const [pending, setPending] = useState<{ kind: "remove" | "transfer" | "leave"; member: WorkspaceMember } | null>(null);

  const canManage = (target: WorkspaceMember) => manage && target.role !== "owner" && target.userId !== meId && (current.role === "owner" || ROLE_RANK[target.role] < myRank);
  const grantable = ASSIGNABLE_ROLES.filter((r) => ROLE_RANK[r] <= myRank);

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast(message);
      members.reload();
      await reload();
    } catch (err) {
      toast(errorMessage(err, t), "warning");
    }
  };

  return (
    <Section title={m.title} description={m.description}>
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {!members.data
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="p-4">
                <Skeleton className="h-10 w-full" />
              </li>
            ))
          : members.data.map((member) => {
              const self = member.userId === meId;
              return (
                <li key={member.userId} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-raised font-display text-xs font-bold text-fg" aria-hidden>
                    {initials(member.name)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-semibold text-fg">
                      {member.name} {self && <span className="font-normal text-subtle">({m.you})</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {member.email} · {m.joined(formatDate(member.joinedAt, locale))}
                    </p>
                  </div>
                  {canManage(member) ? (
                    <Select
                      size="sm"
                      aria-label={m.roleOf(member.name)}
                      value={member.role}
                      onChange={(e) => run(() => updateMemberRole(member.userId, e.target.value as AssignableRole), m.roleUpdated)}
                      options={grantable.map((r) => ({ value: r, label: t.workspace.roles[r] }))}
                    />
                  ) : (
                    <Pill tone={member.role === "owner" ? "default" : "muted"}>{t.workspace.roles[member.role as WorkspaceRole]}</Pill>
                  )}
                  <div className="flex gap-1">
                    {current.role === "owner" && !self && (
                      <Button variant="ghost" size="sm" onClick={() => setPending({ kind: "transfer", member })}>
                        {m.makeOwner}
                      </Button>
                    )}
                    {canManage(member) && (
                      <Button variant="ghost-danger" size="sm" leadingIcon={<Trash2 className="size-3.5" />} onClick={() => setPending({ kind: "remove", member })}>
                        {m.remove}
                      </Button>
                    )}
                    {self && current.role !== "owner" && (
                      <Button variant="ghost-danger" size="sm" leadingIcon={<LogOut className="size-3.5" />} onClick={() => setPending({ kind: "leave", member })}>
                        {m.leave}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
      </ul>

      {manage && <InviteForm grantable={grantable} onInvited={invitations.reload} />}
      {manage && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-fg">{t.workspace.invite.pending}</h3>
          {!invitations.data ? (
            <Skeleton className="h-12 w-full" />
          ) : invitations.data.length === 0 ? (
            <p className="text-sm text-subtle">{t.workspace.invite.none}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line">
              {invitations.data.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm text-fg">{inv.email}</p>
                    <p className="text-xs text-muted">
                      {t.workspace.roles[inv.role]} ·{" "}
                      {inv.status === "expired" ? t.workspace.invite.expired : t.workspace.invite.expires(formatDate(inv.expiresAt, locale))}
                    </p>
                  </div>
                  {inv.status === "pending" && (
                    <Button variant="ghost" size="sm" onClick={() => run(() => revokeInvitation(inv.id).then(invitations.reload), t.workspace.invite.revoked)}>
                      {t.workspace.invite.revoke}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Confirm
        open={pending !== null}
        onClose={() => setPending(null)}
        danger={pending?.kind !== "transfer"}
        title={pending?.kind === "transfer" ? m.makeOwner : pending?.kind === "leave" ? m.leave : m.remove}
        text={pending ? (pending.kind === "transfer" ? m.transferConfirm(pending.member.name) : pending.kind === "leave" ? m.leaveConfirm : m.removeConfirm(pending.member.name)) : ""}
        confirmLabel={pending?.kind === "transfer" ? m.makeOwner : pending?.kind === "leave" ? m.leave : m.remove}
        onConfirm={async () => {
          if (!pending) return;
          const { kind, member } = pending;
          setPending(null);
          if (kind === "transfer") return run(() => transferOwnership(member.userId), m.transferred(member.name));
          if (kind === "remove") return run(() => removeMember(member.userId), m.removed(member.name));
          try {
            await removeMember(member.userId);
            toast(m.left(current.name));
            // The left workspace is gone from the list: the provider falls back to another one.
            await reload();
            router.push("/qr-codes");
          } catch (err) {
            toast(errorMessage(err, t), "warning");
          }
        }}
      />
    </Section>
  );
}

function InviteForm({ grantable, onInvited }: { grantable: readonly AssignableRole[]; onInvited: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const inv = t.workspace.invite;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>(grantable.includes("editor") ? "editor" : grantable[grantable.length - 1]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [created, setCreated] = useState<{ email: string; url: string } | null>(null);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-fg">{inv.title}</h3>
        <p className="text-xs text-subtle">{inv.noEmail}</p>
      </div>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(undefined);
          try {
            const res = await createInvitation({ email: email.trim(), role });
            setCreated({ email: res.invitation.email, url: `${window.location.origin}/invite/${res.token}` });
            setEmail("");
            onInvited();
          } catch (err) {
            setError(errorMessage(err, t));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={inv.email} error={error} className="flex-1">
          {(id, d) => <Input id={id} type="email" aria-describedby={d} value={email} placeholder={inv.emailPlaceholder} onChange={(e) => setEmail(e.target.value)} required />}
        </Field>
        <Field label={inv.role} className="sm:w-40">
          {(id) => <Select id={id} className="w-full" value={role} onChange={(e) => setRole(e.target.value as AssignableRole)} options={grantable.map((r) => ({ value: r, label: t.workspace.roles[r] }))} />}
        </Field>
        <Button type="submit" className="sm:mb-0" disabled={busy || !email.trim()} leadingIcon={<Link2 className="size-4" />}>
          {busy ? inv.creating : inv.submit}
        </Button>
      </form>
      <p className="text-xs text-subtle">{t.workspace.roleHints[role]}</p>
      {created && (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-bg p-3">
          <p className="text-xs font-semibold text-fg">
            {inv.linkReady} · <span className="font-normal text-subtle">{inv.linkFor(created.email)}</span>
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md bg-surface px-2 py-1.5 font-mono text-xs text-muted-2">{created.url}</code>
            <Button
              size="sm"
              variant="neutral"
              leadingIcon={<Copy className="size-3.5" />}
              onClick={async () => {
                await copyText(created.url);
                toast(inv.copied, "info");
              }}
            >
              {inv.copy}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function DangerZone() {
  const { current, can, reload } = useWorkspace();
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const d = t.workspace.danger;
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const allowed = can("workspace:delete");

  return (
    <Section title={d.title} description={allowed ? d.description : d.ownerOnly} tone="danger">
      <Button variant="destructive" size="sm" className="self-start" disabled={!allowed} leadingIcon={<AlertTriangle className="size-4" />} onClick={() => setOpen(true)}>
        {d.delete}
      </Button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirm("");
          setError(undefined);
        }}
        title={d.confirmTitle}
      >
        <p className="text-sm text-muted">{d.description}</p>
        <p className="text-sm text-fg">{d.confirmText(current.slug)}</p>
        <Field label={d.confirmLabel} error={error}>
          {(id, desc) => <Input id={id} aria-describedby={desc} value={confirm} autoComplete="off" spellCheck={false} placeholder={current.slug} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t.common.cancel}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busy || confirm.trim() !== current.slug}
            onClick={async () => {
              setBusy(true);
              try {
                await deleteWorkspace(confirm.trim());
                toast(d.deleted(current.name), "info");
                await reload();
                router.push("/qr-codes");
              } catch (err) {
                setError(errorMessage(err, t));
                setBusy(false);
              }
            }}
          >
            {busy ? d.deleting : d.delete}
          </Button>
        </div>
      </Modal>
    </Section>
  );
}
