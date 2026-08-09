"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type {
  AdminRewardUserList,
  RewardReason,
  RewardWallet,
} from "@/lib/rewards/types";

const REASON_LABELS: Record<RewardReason, string> = {
  manual_credit: "Crédito manual",
  manual_debit: "Retirada manual",
  purchase_feedback: "Compra + feedback",
  correction: "Correção de saldo",
};

const COMMUNITY_REWARDS = [
  { cost: 80, label: "1 key diária + 1 Spoofer (BE)" },
  { cost: 100, label: "2 keys diárias" },
  { cost: 130, label: "1 key semanal" },
  { cost: 150, label: "1 key mensal" },
] as const;

async function apiPayload<T>(response: Response) {
  const payload = (await response.json()) as T & {
    error?: string;
    errors?: string[];
  };
  if (!response.ok) {
    throw new Error(
      payload.errors?.length
        ? `${payload.error ?? "Revise os dados"}\n• ${payload.errors.join("\n• ")}`
        : payload.error || "Não foi possível concluir o ajuste.",
    );
  }
  return payload;
}

export function RewardManager({
  initialList,
  userEmail,
}: {
  initialList: AdminRewardUserList;
  userEmail: string;
}) {
  const [users, setUsers] = useState(initialList.users);
  const [state, setState] = useState(initialList.state);
  const [selectedId, setSelectedId] = useState(initialList.users[0]?.userId ?? null);
  const [query, setQuery] = useState("");
  const [wallet, setWallet] = useState<RewardWallet>("community");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("10");
  const [reason, setReason] = useState<RewardReason>("manual_credit");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const pendingRequestRef = useRef<{ fingerprint: string; requestId: string } | null>(null);
  const selected = useMemo(
    () => users.find((user) => user.userId === selectedId) ?? null,
    [selectedId, users],
  );

  const search = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await apiPayload<AdminRewardUserList>(
        await fetch(`/api/admin/rewards?q=${encodeURIComponent(query.trim())}`, {
          cache: "no-store",
        }),
      );
      setUsers(result.users);
      setState(result.state);
      setSelectedId(result.users[0]?.userId ?? null);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "A busca falhou.",
      });
    } finally {
      setBusy(false);
    }
  };

  const apply = async (
    targetWallet: RewardWallet,
    delta: number,
    targetReason: RewardReason,
    targetNote: string,
  ) => {
    if (!selected || busy || state !== "ready" || !Number.isSafeInteger(delta) || delta === 0) return;
    if (
      delta < 0 &&
      !window.confirm(
        `Confirmar retirada de ${Math.abs(delta).toLocaleString("pt-BR")} ${targetWallet === "community" ? "6DNX Coins" : "Moedas da Slot"} de ${selected.displayName}?`,
      )
    ) return;

    setBusy(true);
    setNotice(null);
    const fingerprint = JSON.stringify({
      userId: selected.userId,
      wallet: targetWallet,
      delta,
      reason: targetReason,
      note: targetNote.trim(),
    });
    const requestId = pendingRequestRef.current?.fingerprint === fingerprint
      ? pendingRequestRef.current.requestId
      : crypto.randomUUID();
    pendingRequestRef.current = { fingerprint, requestId };
    try {
      const result = await apiPayload<{
        adjustment: { wallet: RewardWallet; new_balance: number | string; applied: boolean };
      }>(
        await fetch("/api/admin/rewards", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: selected.userId,
            wallet: targetWallet,
            delta,
            reason: targetReason,
            note: targetNote,
            requestId,
          }),
        }),
      );
      pendingRequestRef.current = null;
      const nextBalance = Number(result.adjustment.new_balance);
      setUsers((current) => current.map((user) =>
        user.userId === selected.userId
          ? {
              ...user,
              balances: { ...user.balances, [targetWallet]: nextBalance },
              latestActivity: new Date().toISOString(),
            }
          : user,
      ));
      setNotice({
        tone: "ok",
        text: result.adjustment.applied
          ? "Ajuste registrado com auditoria completa."
          : "Esta solicitação já havia sido processada; nenhum valor foi duplicado.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "O ajuste falhou.",
      });
    } finally {
      setBusy(false);
    }
  };

  const applyCustom = () => {
    const parsedAmount = Number(amount);
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
      setNotice({ tone: "error", text: "Informe uma quantidade inteira maior que zero." });
      return;
    }
    const effectiveReason: RewardReason = direction === "remove"
      ? reason === "manual_debit" || reason === "correction"
        ? reason
        : "manual_debit"
      : reason === "manual_debit"
        ? "manual_credit"
        : reason;
    void apply(wallet, direction === "remove" ? -parsedAmount : parsedAmount, effectiveReason, note);
  };

  return (
    <main className="admin-content-page admin-rewards-page">
      <header className="admin-content-topbar">
        <Link href="/admin" className="admin-topbar__brand">
          <span>6</span><div><strong>6DNX</strong><small>Central de comando</small></div>
        </Link>
        <div className="admin-content-topbar__actions">
          <Link href="/" target="_blank" rel="noreferrer">Ver site ↗</Link>
          <span>{userEmail}</span>
        </div>
      </header>

      <section className="admin-content-workspace">
        <header className="admin-content-heading">
          <div>
            <span className="admin-kicker">Loyalty e comunidade</span>
            <h1>Carteiras de recompensas</h1>
            <p>Administre separadamente as Moedas da Slot e os 6DNX Coins. Nenhum ajuste apaga o histórico.</p>
          </div>
          <div className="admin-content-heading__actions">
            <Link href="/admin" className="admin-secondary-button">Voltar aos produtos</Link>
          </div>
        </header>

        {state === "mfa-required" ? (
          <div className="admin-notice admin-notice--info" role="status">
            <span>2</span><p><strong>Segundo fator necessário.</strong><br />Carteiras e dados de usuários ficam bloqueados até a sessão administrativa confirmar MFA (AAL2).</p>
          </div>
        ) : state !== "ready" ? (
          <div className="admin-notice admin-notice--info" role="status">
            <span>i</span><p><strong>Carteiras ainda não habilitadas no banco.</strong><br />Após revisão, aplique as migrations de fidelidade e de duas carteiras na ordem documentada. Nenhum saldo atual foi alterado.</p>
          </div>
        ) : null}
        {notice ? (
          <div className={`admin-notice admin-notice--${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
            <span>{notice.tone === "ok" ? "✓" : "!"}</span><p>{notice.text}</p>
          </div>
        ) : null}

        <div className="admin-rewards-layout">
          <aside className="admin-reward-users">
            <form onSubmit={(event) => { event.preventDefault(); void search(); }}>
              <input value={query} maxLength={80} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, e-mail ou Discord…" />
              <button type="submit" disabled={busy}>Buscar</button>
            </form>
            <nav aria-label="Usuários cadastrados">
              {users.length ? users.map((user) => (
                <button type="button" key={user.userId} className={user.userId === selectedId ? "is-active" : ""} onClick={() => { setSelectedId(user.userId); setNotice(null); }}>
                  <span><strong>{user.displayName}</strong><small>{user.email}</small></span>
                  <span><b>{user.balances.community}</b><small>Coins</small></span>
                </button>
              )) : <p>Nenhum usuário encontrado.</p>}
            </nav>
          </aside>

          <section className="admin-reward-workspace">
            {selected ? (
              <>
                <header className="admin-reward-user-heading">
                  <div><span className="admin-kicker">Usuário selecionado</span><h2>{selected.displayName}</h2><p>{selected.email}{selected.discordDisplayName ? ` · Discord: ${selected.discordDisplayName}` : ""}</p></div>
                </header>

                <div className="admin-wallet-grid">
                  <article className="admin-wallet-card admin-wallet-card--community">
                    <span>6DNX Coins</span><strong>{selected.balances.community.toLocaleString("pt-BR")}</strong>
                    <p>Moeda da comunidade, usada nas trocas assistidas pelo ticket.</p>
                    <button type="button" onClick={() => void apply("community", 10, "purchase_feedback", "Compra confirmada + feedback validado")} disabled={busy}>+10 · Compra + feedback</button>
                  </article>
                  <article className="admin-wallet-card admin-wallet-card--slot">
                    <span>Moedas da Slot</span><strong>{selected.balances.slot.toLocaleString("pt-BR")}</strong>
                    <p>Carteira exclusiva da experiência Slot. O motor real continua desativado.</p>
                    <button type="button" onClick={() => { setWallet("slot"); setDirection("add"); setReason("manual_credit"); setAmount("10"); }}>Preparar crédito</button>
                  </article>
                </div>

                <section className="admin-reward-adjustment">
                  <div className="admin-section-heading"><div><span className="admin-kicker">Ajuste auditado</span><h2>Adicionar ou remover saldo</h2><p>Todo movimento registra administrador, motivo, observação e saldo antes/depois.</p></div></div>
                  <div className="admin-form-grid">
                    <label className="admin-field"><span>Carteira</span><select value={wallet} onChange={(event) => setWallet(event.target.value as RewardWallet)}><option value="community">6DNX Coins</option><option value="slot">Moedas da Slot</option></select></label>
                    <label className="admin-field"><span>Operação</span><select value={direction} onChange={(event) => setDirection(event.target.value as "add" | "remove")}><option value="add">Adicionar</option><option value="remove">Remover</option></select></label>
                    <label className="admin-field"><span>Quantidade inteira</span><input type="number" min="1" max="1000000" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
                    <label className="admin-field"><span>Motivo</span><select value={reason} onChange={(event) => setReason(event.target.value as RewardReason)}>{Object.entries(REASON_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                    <label className="admin-field admin-field--wide"><span>Observação opcional</span><textarea maxLength={240} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex.: missão validada no Discord, correção solicitada no ticket…" /></label>
                  </div>
                  <button type="button" className="admin-primary-button" onClick={applyCustom} disabled={busy || state !== "ready"}>{busy ? "Registrando…" : "Confirmar ajuste"}</button>
                </section>

                <section className="admin-community-rewards">
                  <div className="admin-section-heading"><div><span className="admin-kicker">Catálogo de recompensas</span><h2>Trocas de 6DNX Coins</h2><p>Referências do Maycon. O resgate real será feito por uma Central de Recompensas própria, sem PIX e sem débito manual disfarçado.</p></div></div>
                  <div>{COMMUNITY_REWARDS.map((reward) => <article key={reward.cost} aria-label={`${reward.cost} Coins: ${reward.label}`}><strong>{reward.cost} Coins</strong><span>{reward.label}</span><small>Em preparação</small></article>)}</div>
                </section>
              </>
            ) : <div className="admin-reward-empty"><strong>Selecione um usuário</strong><p>Busque por nome, e-mail ou identidade do Discord.</p></div>}
          </section>
        </div>
      </section>
    </main>
  );
}
