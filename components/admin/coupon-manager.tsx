"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  AdminCoupon,
  AdminCouponList,
  CouponStatus,
} from "@/lib/coupons/types";

type Draft = {
  code: string;
  name: string;
  discountPercent: string;
  minimumAmount: string;
  startsAt: string;
  expiresAt: string;
  status: CouponStatus;
};

const EMPTY_DRAFT: Draft = {
  code: "",
  name: "",
  discountPercent: "10",
  minimumAmount: "0,00",
  startsAt: "",
  expiresAt: "",
  status: "draft",
};

const STATUS_LABELS: Record<CouponStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

function dateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromCoupon(coupon: AdminCoupon): Draft {
  return {
    code: coupon.code,
    name: coupon.name,
    discountPercent: String(coupon.discountPercent),
    minimumAmount: (coupon.minimumAmountCents / 100)
      .toFixed(2)
      .replace(".", ","),
    startsAt: dateTimeLocal(coupon.startsAt),
    expiresAt: dateTimeLocal(coupon.expiresAt),
    status: coupon.status,
  };
}

function amountCents(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized || 0);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}

async function apiPayload<T>(response: Response) {
  const payload = (await response.json()) as T & {
    error?: string;
    errors?: string[];
  };
  if (!response.ok) {
    throw new Error(
      payload.errors?.length
        ? `${payload.error ?? "Revise os campos"}\n• ${payload.errors.join("\n• ")}`
        : payload.error || "Não foi possível salvar o cupom.",
    );
  }
  return payload;
}

export function CouponManager({
  initialList,
  userEmail,
}: {
  initialList: AdminCouponList;
  userEmail: string;
}) {
  const [coupons, setCoupons] = useState(initialList.coupons);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const selected = coupons.find((coupon) => coupon.id === selectedId) ?? null;
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return coupons.filter(
      (coupon) =>
        !term ||
        coupon.code.toLocaleLowerCase("pt-BR").includes(term) ||
        coupon.name.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [coupons, query]);

  const select = (coupon: AdminCoupon | null) => {
    setSelectedId(coupon?.id ?? null);
    setDraft(coupon ? fromCoupon(coupon) : EMPTY_DRAFT);
    setNotice(null);
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = async (overrideStatus?: CouponStatus) => {
    if (busy || initialList.state !== "ready") return;
    setBusy(true);
    setNotice(null);
    const nextStatus = overrideStatus ?? draft.status;
    try {
      const payload = await apiPayload<{ coupon: AdminCoupon }>(
        await fetch(
          selected ? `/api/admin/coupons/${selected.id}` : "/api/admin/coupons",
          {
            method: selected ? "PATCH" : "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              code: draft.code,
              name: draft.name,
              discountPercent: Number(draft.discountPercent),
              minimumAmountCents: amountCents(draft.minimumAmount),
              startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
              expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null,
              status: nextStatus,
              expectedUpdatedAt: selected?.updatedAt ?? null,
            }),
          },
        ),
      );
      setCoupons((current) => {
        const exists = current.some((coupon) => coupon.id === payload.coupon.id);
        return exists
          ? current.map((coupon) =>
              coupon.id === payload.coupon.id ? payload.coupon : coupon,
            )
          : [payload.coupon, ...current];
      });
      select(payload.coupon);
      setNotice({ tone: "ok", text: "Cupom salvo. A validação no checkout já usa esta regra." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Não foi possível salvar o cupom.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-content-page admin-coupons-page">
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
            <span className="admin-kicker">Campanhas comerciais</span>
            <h1>Cupons de desconto</h1>
            <p>Crie códigos com percentual, validade e valor mínimo. O total é calculado no servidor.</p>
          </div>
          <div className="admin-content-heading__actions">
            <Link href="/admin" className="admin-secondary-button">Voltar aos produtos</Link>
            <button type="button" className="admin-primary-button" onClick={() => save()} disabled={busy || initialList.state !== "ready"}>
              {busy ? "Salvando…" : selected ? "Salvar cupom" : "Criar cupom"}
            </button>
          </div>
        </header>

        {initialList.state !== "ready" ? (
          <div className="admin-notice admin-notice--info" role="status">
            <span>i</span><p><strong>Cupons ainda não habilitados no banco.</strong><br />Aplique, após revisão, a migration <code>20260809180000_add_commerce_coupons.sql</code>. O checkout sem cupom continua funcionando.</p>
          </div>
        ) : null}
        {notice ? (
          <div className={`admin-notice admin-notice--${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
            <span>{notice.tone === "ok" ? "✓" : "!"}</span><p>{notice.text}</p>
          </div>
        ) : null}

        <div className="admin-coupon-layout">
          <aside className="admin-coupon-list">
            <div className="admin-coupon-list__tools">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cupom…" />
              <button type="button" onClick={() => select(null)}>+ Novo cupom</button>
            </div>
            {filtered.length ? filtered.map((coupon) => (
              <button type="button" key={coupon.id} className={coupon.id === selectedId ? "is-active" : ""} onClick={() => select(coupon)}>
                <span><strong>{coupon.code}</strong><small>{coupon.name}</small></span>
                <span><b>{coupon.discountPercent}%</b><small>{STATUS_LABELS[coupon.status]}</small></span>
              </button>
            )) : <p>Nenhum cupom cadastrado.</p>}
          </aside>

          <section className="admin-coupon-form">
            <div className="admin-section-heading"><div><span className="admin-kicker">{selected ? "Editar regra" : "Nova campanha"}</span><h2>{selected ? selected.code : "Cadastrar cupom"}</h2><p>Arquive em vez de excluir para preservar o histórico de pedidos.</p></div></div>
            <div className="admin-form-grid">
              <label className="admin-field"><span>Código para o cliente</span><input value={draft.code} maxLength={32} onChange={(event) => update("code", event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="BEMVINDO10" /></label>
              <label className="admin-field"><span>Nome interno</span><input value={draft.name} maxLength={80} onChange={(event) => update("name", event.target.value)} placeholder="Boas-vindas de agosto" /></label>
              <label className="admin-field"><span>Desconto em porcentagem</span><input type="number" min="1" max="90" step="1" value={draft.discountPercent} onChange={(event) => update("discountPercent", event.target.value)} /></label>
              <label className="admin-field"><span>Compra mínima em reais</span><input inputMode="decimal" value={draft.minimumAmount} onChange={(event) => update("minimumAmount", event.target.value)} placeholder="0,00" /></label>
              <label className="admin-field"><span>Início opcional</span><input type="datetime-local" value={draft.startsAt} onChange={(event) => update("startsAt", event.target.value)} /></label>
              <label className="admin-field"><span>Validade opcional</span><input type="datetime-local" value={draft.expiresAt} onChange={(event) => update("expiresAt", event.target.value)} /></label>
              <label className="admin-field admin-field--wide"><span>Status</span><select value={draft.status} onChange={(event) => update("status", event.target.value as CouponStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><small>Somente “Ativo” pode ser aplicado por clientes.</small></label>
            </div>
            <div className="admin-coupon-summary">
              <span>Prévia</span><strong>{draft.code || "SEUCUPOM"}</strong><b>{draft.discountPercent || "0"}% OFF</b><small>{draft.name || "Nome da campanha"}</small>
            </div>
            {selected && selected.status !== "archived" ? (
              <button type="button" className="admin-coupon-archive" onClick={() => save("archived")} disabled={busy}>Arquivar cupom</button>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
