"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string; status: string };

export function AdminSecondFactor({ onVerified }: { onVerified: () => void }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [factors, setFactors] = useState<Array<{ id: string; label: string }>>([]);
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [canEnroll, setCanEnroll] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try { await action(); }
    catch { setMessage("Não foi possível confirmar a segurança. Confira sua conexão e tente novamente. Se a sessão expirou, entre novamente no painel."); }
    finally { lock.current = false; setBusy(false); }
  }

  function inspect() {
    void run(async () => {
      const client = createSupabaseBrowserClient();
      const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error) throw assurance.error;
      if (assurance.data.currentLevel === "aal2") {
        setVerified(true); onVerified(); return;
      }
      const result = await client.auth.mfa.listFactors();
      if (result.error) throw result.error;
      const available = (result.data.totp as Factor[]).map((factor, index) => ({ id: factor.id, label: factor.friendly_name || `Autenticador ${index + 1}` }));
      setFactors(available);
      setFactorId(available[0]?.id ?? "");
      setCanEnroll(available.length === 0 && (result.data.all as Factor[]).every((factor) => factor.status !== "verified"));
      if (!available.length && (result.data.all as Factor[]).some((factor) => factor.status === "verified")) {
        setMessage("Esta conta usa outro tipo de segundo fator. Confirme-o pelo fluxo em que foi configurado; nenhum fator existente será removido.");
      }
    });
  }

  function enroll() {
    void run(async () => {
      const result = await createSupabaseBrowserClient().auth.mfa.enroll({ factorType: "totp", friendlyName: `Estúdio 6DNX ${Date.now()}` });
      if (result.error) {
        setMessage("Não foi possível cadastrar o autenticador. Pode haver cadastros pendentes ou um limite da conta. Tente novamente ou peça suporte; nenhum fator existente foi removido.");
        return;
      }
      setFactorId(result.data.id);
      setSetup({ qr: result.data.totp.qr_code, secret: result.data.totp.secret });
      setCanEnroll(false);
    });
  }

  function verify() {
    if (!/^\d{6}$/.test(code) || !factorId) return;
    void run(async () => {
      const result = await createSupabaseBrowserClient().auth.mfa.challengeAndVerify({ factorId, code });
      setCode("");
      if (result.error) {
        setMessage("Código recusado ou expirado. Use o código atual do autenticador e confira se o horário do celular está automático.");
        return;
      }
      setSetup(null);
      setFactorId("");
      setVerified(true);
      onVerified();
    });
  }

  return <section className="admin-form-section admin-mfa" aria-labelledby="admin-mfa-title">
    <h2 id="admin-mfa-title">Confirmação de segurança</h2>
    <p>Para publicar ou restaurar uma versão, confirme o código do seu aplicativo autenticador. Seu rascunho permanece nesta tela.</p>
    {verified ? <div><p role="status">Segurança confirmada. Você já pode tentar publicar novamente.</p><button type="button" className="admin-secondary-button" onClick={() => { setVerified(false); inspect(); }} disabled={busy}>Confirmar novamente</button></div> : <>
      {!factorId && !canEnroll ? <button type="button" className="admin-secondary-button" disabled={busy} onClick={inspect}>{busy ? "Consultando…" : "Confirmar segundo fator"}</button> : null}
      {canEnroll ? <div><p>Esta conta ainda não possui um autenticador confirmado. Cadastre um no seu celular para proteger a publicação.</p><button type="button" className="admin-secondary-button" disabled={busy} onClick={enroll}>{busy ? "Preparando…" : "Cadastrar aplicativo autenticador"}</button></div> : null}
      {setup ? <div className="admin-mfa-setup">
        <p>Leia o QR Code com seu aplicativo autenticador. Guarde o acesso ao aplicativo: ele será necessário nas próximas confirmações. Não compartilhe esta imagem ou a chave.</p>
        {/* Supabase supplies a data-image, never inserted as inline SVG markup. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={setup.qr} alt="QR Code para cadastrar o autenticador desta conta" width={200} height={200} />
        <details><summary>Não consigo ler o QR Code</summary><p>Digite esta chave no aplicativo:</p><code>{setup.secret}</code></details>
      </div> : null}
      {factorId ? <form onSubmit={(event) => { event.preventDefault(); verify(); }}>
        {factors.length > 1 ? <label className="admin-field"><span>Aplicativo autenticador</span><select value={factorId} disabled={busy} onChange={(event) => setFactorId(event.target.value)}>{factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.label}</option>)}</select></label> : null}
        <label className="admin-field"><span>Código de seis dígitos</span><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required disabled={busy} /></label>
        <button type="submit" className="admin-primary-button" disabled={busy || code.length !== 6}>{busy ? "Confirmando…" : "Validar código"}</button>
      </form> : null}
    </>}
    {message ? <p role="alert">{message}</p> : null}
  </section>;
}
