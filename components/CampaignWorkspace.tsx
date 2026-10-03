"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { scenarios } from "@/lib/data";
import { ThemeToggle } from "@/components/ThemeToggle";

type Campaign = {
  id: string;
  title: string;
  event: string;
  district: string;
  purpose: string;
  target: number;
  hostName: string;
  hostContact: string;
  bankName: string;
  accountHolder: string;
  accountLast4: string;
  ifsc: string;
  authority: string;
  permissionReference: string;
  permissionDocument: string;
  createdAt: string;
  hostApproved: boolean;
  governmentApproved: boolean;
  heldAmount: number;
  releasedAmount: number;
};

const STORAGE_KEY = "innovision:campaign-preview:v1";

export function CampaignWorkspace({ onBack }: { onBack: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdId, setCreatedId] = useState("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setCampaigns(parsed as Campaign[]);
      }
    } catch {
      setCampaigns([]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    } catch {
      /* The preview remains available until this page is closed. */
    }
  }, [campaigns, hydrated]);

  const heldTotal = campaigns.reduce((total, campaign) => total + campaign.heldAmount, 0);
  const releasedTotal = campaigns.reduce((total, campaign) => total + campaign.releasedAmount, 0);

  function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const accountNumber = String(data.get("accountNumber") ?? "").replace(/\s/g, "");
    const accountConfirmation = String(data.get("accountConfirmation") ?? "").replace(/\s/g, "");
    if (accountNumber !== accountConfirmation) {
      setFormError("Bank account numbers do not match.");
      return;
    }

    const permissionFile = data.get("permissionDocument");
    if (!(permissionFile instanceof File) || permissionFile.size === 0) {
      setFormError("Attach the authority permission document to continue.");
      return;
    }

    const campaign: Campaign = {
      id: `CMP-${crypto.randomUUID().toUpperCase()}`,
      title: String(data.get("title")),
      event: String(data.get("event")),
      district: String(data.get("district")),
      purpose: String(data.get("purpose")),
      target: Number(data.get("target")),
      hostName: String(data.get("hostName")),
      hostContact: String(data.get("hostContact")),
      bankName: String(data.get("bankName")),
      accountHolder: String(data.get("accountHolder")),
      accountLast4: accountNumber.slice(-4),
      ifsc: String(data.get("ifsc")).toUpperCase(),
      authority: String(data.get("authority")),
      permissionReference: String(data.get("permissionReference")),
      permissionDocument: permissionFile.name,
      createdAt: new Date().toISOString(),
      hostApproved: false,
      governmentApproved: false,
      heldAmount: 0,
      releasedAmount: 0,
    };

    setCampaigns((current) => [campaign, ...current]);
    setCreatedId(campaign.id);
    setFormOpen(false);
    form.reset();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line/25 bg-ground-deep">
        <div className="mx-auto flex min-h-[68px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span aria-hidden className="grid size-9 place-items-center rounded-panel border border-signal/35 bg-signal/10 font-mono text-[13px] font-semibold text-signal">I</span>
            <span className="font-mono text-[12px] font-semibold tracking-[0.18em] text-ink">INNOVISION</span>
          </div>
          <nav aria-label="Campaign workspace" className="flex items-center gap-2">
            <button type="button" onClick={onBack} className="press rounded-panel border border-line/30 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted hover:bg-panel-raised hover:text-ink">
              Back to cases
            </button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line/25 pb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-signal">Public relief funding</p>
            <h1 className="mt-1 text-[25px] font-semibold tracking-tight text-ink">Campaign funds</h1>
            <p className="mt-1 max-w-2xl text-[12px] text-muted">Create a relief campaign and submit its authority permission for review.</p>
          </div>
          <button type="button" onClick={() => { setFormError(""); setFormOpen((open) => !open); }} className="press rounded-panel bg-signal px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-[rgb(var(--on-signal))]">
            {formOpen ? "Close form" : "Create campaign"}
          </button>
        </div>

        <p className="mt-4 border-l-2 border-signal/60 pl-3 text-[11px] text-muted">
          UI preview only. No bank details are transmitted, and no deposits, transfers, or approvals are processed.
        </p>

        <div className="mt-6 grid grid-cols-1 divide-y divide-line/20 border-y border-line/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Summary label="Held in campaign bank accounts" value={formatAmount(heldTotal)} />
          <Summary label="Released to government relief fund" value={formatAmount(releasedTotal)} />
          <Summary label="Campaigns" value={String(campaigns.length)} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section aria-labelledby="campaign-list-title">
            <div className="flex items-center justify-between border-b border-line/20 pb-3">
              <h2 id="campaign-list-title" className="font-mono text-[10px] uppercase tracking-widest text-faint">Campaign register</h2>
              <span className="font-mono text-[10px] text-faint">{campaigns.length} total</span>
            </div>
            {campaigns.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[14px] font-medium text-ink">No campaigns created</p>
                <p className="mt-1 text-[12px] text-muted">New campaigns will appear here with their review and fund status.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line/20">
                {campaigns.map((campaign) => (
                  <li key={campaign.id} className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-medium text-ink">{campaign.title}</h3>
                        <p className="mt-1 text-[12px] text-muted">{campaign.event} · {campaign.district}</p>
                        <p className="mt-1 font-mono text-[10px] text-faint">{campaign.id} · submitted {new Date(campaign.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                      <span className="rounded-panel border border-signal/30 bg-signal/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-signal">Awaiting review</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <CampaignValue label="Target" value={formatAmount(campaign.target)} />
                      <CampaignValue label="Held" value={formatAmount(campaign.heldAmount)} />
                      <CampaignValue label="Released" value={formatAmount(campaign.releasedAmount)} />
                      <CampaignValue label="Host" value={campaign.hostName} />
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 border-t border-line/15 pt-4 sm:grid-cols-2">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-faint">Authority permission</div>
                        <p className="mt-1 text-[11px] text-ink">{campaign.authority} · {campaign.permissionReference}</p>
                        <p className="mt-1 text-[10px] text-muted">{campaign.permissionDocument}</p>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-faint">Designated bank account</div>
                        <p className="mt-1 text-[11px] text-ink">{campaign.bankName} · {campaign.accountHolder}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted">•••• {campaign.accountLast4} · {campaign.ifsc}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-line/15 pt-3 font-mono text-[10px]">
                      <Approval label="Host release confirmation" approved={campaign.hostApproved} />
                      <Approval label="Government release approval" approved={campaign.governmentApproved} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="border-t border-line/20 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" aria-labelledby="fund-flow-title">
            <h2 id="fund-flow-title" className="font-mono text-[10px] uppercase tracking-widest text-faint">Fund release flow</h2>
            <ol className="mt-4 space-y-4">
              <FlowStep number="01" title="Campaign created" detail="Host submits campaign and authority permission." />
              <FlowStep number="02" title="Funds held" detail="Contributions remain in the designated campaign account." />
              <FlowStep number="03" title="Dual confirmation" detail="Host confirms; government authority approves release." />
              <FlowStep number="04" title="Relief fund credited" detail="Confirmed amount joins the government relief fund." />
            </ol>
            <p className="mt-5 border-t border-line/20 pt-3 text-[10px] leading-relaxed text-faint">
              Release controls are not active in this UI preview. A verified payment and government approval service is required before money can move.
            </p>
          </aside>
        </div>

        {formOpen && (
          <CampaignForm
            onSubmit={createCampaign}
            error={formError}
            onClose={() => setFormOpen(false)}
            onFillDemoData={() => setFormError("")}
          />
        )}
        {createdId && <p role="status" className="mt-4 text-[12px] text-ink">Campaign {createdId} added to this tab’s preview register.</p>}
      </main>
    </div>
  );
}

function CampaignForm({
  onSubmit,
  error,
  onClose,
  onFillDemoData,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error: string;
  onClose: () => void;
  onFillDemoData: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function fillDemoData() {
    const form = formRef.current;
    if (!form) return;

    const values: Record<string, string> = {
      title: "DEMO - Relief support for flood-affected families",
      event: "Kerala Floods 2018",
      district: "Idukki District, Kerala",
      target: "500000",
      purpose: "Temporary shelter, food supplies, and essential household repairs for affected families.",
      hostName: "Demo Relief Committee",
      hostContact: "9876543210",
      bankName: "State Bank of India (demo)",
      accountHolder: "Demo Relief Committee",
      accountNumber: "123456789012",
      accountConfirmation: "123456789012",
      ifsc: "SBIN0001234",
      authority: "District Disaster Management Authority (demo)",
      permissionReference: "DEMO-NOC-2026-001",
    };

    for (const [name, value] of Object.entries(values)) {
      const field = form.elements.namedItem(name);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement
      ) {
        field.value = value;
      }
    }

    const permissionInput = form.elements.namedItem("permissionDocument");
    if (permissionInput instanceof HTMLInputElement) {
      const transfer = new DataTransfer();
      transfer.items.add(makeDemoPermissionPdf());
      permissionInput.files = transfer.files;
    }
    onFillDemoData();
  }

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-black/65 p-3 sm:p-6" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="create-campaign-title" className="mx-auto my-4 w-full max-w-3xl rounded-panel border border-line/25 bg-panel p-4 shadow-2xl sm:my-8 sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-line/20 pb-4">
          <div>
            <h2 id="create-campaign-title" className="text-[16px] font-medium text-ink">Create relief campaign</h2>
            <p className="mt-1 text-[11px] text-muted">Authority permission is required before a campaign can be submitted for review.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={fillDemoData} className="press rounded-panel border border-line/25 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted hover:text-ink">Fill demo data</button>
            <button type="button" onClick={onClose} aria-label="Close campaign form" className="press rounded-panel border border-line/25 px-3 py-2 font-mono text-[10px] text-muted hover:text-ink">Close</button>
          </div>
        </div>

        <form ref={formRef} className="mt-4 space-y-5" onSubmit={onSubmit}>
          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <legend className="mb-3 font-mono text-[9px] uppercase tracking-widest text-faint">Campaign details</legend>
            <FormField label="Campaign title">
              <input required name="title" maxLength={100} className={inputClass} />
            </FormField>
            <FormField label="Disaster event">
              <select required name="event" className={inputClass} defaultValue="">
                <option value="" disabled>Select event</option>
                {scenarios.map((scenario) => <option key={scenario.meta.id}>{scenario.meta.name} {scenario.meta.year}</option>)}
              </select>
            </FormField>
            <FormField label="District / affected area">
              <input required name="district" maxLength={100} className={inputClass} />
            </FormField>
            <FormField label="Target amount (₹)">
              <input required name="target" type="number" min="1" step="1" inputMode="numeric" className={inputClass} />
            </FormField>
            <FormField label="Relief purpose" className="sm:col-span-2">
              <textarea required name="purpose" rows={2} maxLength={500} className={inputClass} />
            </FormField>
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-4 border-t border-line/20 pt-4 sm:grid-cols-2">
            <legend className="mb-3 font-mono text-[9px] uppercase tracking-widest text-faint">Campaign host</legend>
            <FormField label="Host / organization name">
              <input required name="hostName" autoComplete="name" className={inputClass} />
            </FormField>
            <FormField label="Host contact">
              <input required name="hostContact" type="tel" autoComplete="tel" maxLength={18} className={inputClass} />
            </FormField>
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-4 border-t border-line/20 pt-4 sm:grid-cols-2">
            <legend className="mb-3 font-mono text-[9px] uppercase tracking-widest text-faint">Designated bank account</legend>
            <FormField label="Bank name">
              <input required name="bankName" className={inputClass} />
            </FormField>
            <FormField label="Account holder">
              <input required name="accountHolder" autoComplete="name" className={inputClass} />
            </FormField>
            <FormField label="Account number">
              <input required name="accountNumber" type="password" inputMode="numeric" minLength={9} maxLength={18} autoComplete="new-password" className={inputClass} />
            </FormField>
            <FormField label="Confirm account number">
              <input required name="accountConfirmation" type="password" inputMode="numeric" minLength={9} maxLength={18} autoComplete="new-password" className={inputClass} />
            </FormField>
            <FormField label="IFSC">
              <input required name="ifsc" minLength={11} maxLength={11} autoCapitalize="characters" className={inputClass} />
            </FormField>
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-4 border-t border-line/20 pt-4 sm:grid-cols-2">
            <legend className="mb-3 font-mono text-[9px] uppercase tracking-widest text-faint">Authority permission</legend>
            <FormField label="Issuing authority / department">
              <input required name="authority" className={inputClass} />
            </FormField>
            <FormField label="Permission / NOC reference">
              <input required name="permissionReference" className={inputClass} />
            </FormField>
            <FormField label="Signed permission document" className="sm:col-span-2">
              <input required name="permissionDocument" type="file" accept=".pdf,image/*" className="block w-full text-[12px] text-muted file:mr-3 file:rounded-panel file:border-0 file:bg-panel-raised file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-wider file:text-ink" />
            </FormField>
          </fieldset>

          <p className="text-[10px] text-faint">This preview retains only the account’s last four digits. The permission file and bank details are not sent to an authority.</p>
          {error && <p role="alert" className="text-[12px] text-[#c04a3e]">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-line/20 pt-4">
            <button type="button" onClick={onClose} className="press rounded-panel border border-line/25 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted hover:text-ink">Cancel</button>
            <button type="submit" className="press rounded-panel bg-signal px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-[rgb(var(--on-signal))]">Submit for review</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-4 sm:px-5 first:sm:pl-0 last:sm:pr-0">
      <div className="font-mono text-[9px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mt-1 font-mono text-[20px] text-ink">{value}</div>
    </div>
  );
}

function CampaignValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mt-1 text-[12px] text-ink">{value}</div>
    </div>
  );
}

function Approval({ label, approved }: { label: string; approved: boolean }) {
  return (
    <span className={approved ? "text-[#5f9e6e]" : "text-faint"}>
      {approved ? "CONFIRMED" : "PENDING"} · {label}
    </span>
  );
}

function FlowStep({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className="font-mono text-[10px] text-signal">{number}</span>
      <div>
        <div className="text-[12px] font-medium text-ink">{title}</div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{detail}</p>
      </div>
    </li>
  );
}

function FormField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-faint">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-panel border border-line/30 bg-ground-deep px-3 py-2.5 text-[12px] text-ink placeholder:text-faint focus:border-signal/60";

function makeDemoPermissionPdf(): File {
  const stream = "BT /F1 20 Tf 50 720 Td (DEMO ONLY - NOT AN AUTHORITY APPROVAL) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const [index, object] of objects.entries()) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new File([pdf], "demo-authority-permission.pdf", { type: "application/pdf" });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}