import { useMemo, useState } from "react";
import { z } from "zod";

/**
 * ===== CONFIG YOU WILL EDIT =====
 * 1) Change WEBHOOK_URL after we create the Google Apps Script endpoint
 * 2) Change BRAND values to match your Wix site
 */
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwiM7VJRYhK11l3ydp-8QR4wJKfxW12-DFQmkGYug2lsF7VLpdqj74a7b7Xnx3Wkrc9/exec";

const BRAND = {
  title: "Tournament Setup Intake",
  subtitle: "Fill this out once. We’ll build the tournament correctly the first time.",
  fontFamily: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`,
  // Pull these from your Wix theme colors
  primary: "#0f172a",
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  danger: "#e11d48",
};

type FieldBase = {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
};

type TextField = FieldBase & {
  type: "text" | "email" | "phone" | "number" | "textarea";
  placeholder?: string;
};

type DateField = FieldBase & {
  type: "date" | "time";
};

type SelectField = FieldBase & {
  type: "select";
  options: string[];
};

type MultiField = FieldBase & {
  type: "multi";
  options: string[];
};

type Field = TextField | DateField | SelectField | MultiField;

type Step = {
  id: string;
  title: string;
  subtitle?: string;
  fields: Field[];
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT",
  "NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function buildSteps(): Step[] {
  return [
    {
      id: "organizer",
      title: "Organizer",
      subtitle: "Who are we working with?",
      fields: [
        { key: "organizerName", label: "Full name", type: "text", required: true, placeholder: "John Smith" },
        { key: "organizerEmail", label: "Email", type: "email", required: true, placeholder: "john@email.com" },
        { key: "organizerPhone", label: "Phone", type: "phone", required: true, placeholder: "(555) 555-5555" },
        { key: "organization", label: "Organization / Charity (optional)", type: "text", placeholder: "Example: Ducks Unlimited Chapter" },
        { key: "isDirector", label: "Are you the tournament director?", type: "select", required: true, options: ["Yes", "No"] },
        { key: "directorName", label: "If no, director name", type: "text", placeholder: "Director name" },
      ],
    },
    {
      id: "basics",
      title: "Basics",
      subtitle: "This becomes your public tournament page copy.",
      fields: [
        { key: "tournamentName", label: "Tournament name", type: "text", required: true, placeholder: "2026 Charity Bass Bash" },
        {
          key: "tournamentType",
          label: "Tournament type",
          type: "select",
          required: true,
          options: ["Open Tournament", "Charity Event", "Club Event", "Corporate Event", "Other"],
        },
        { key: "description", label: "Description", type: "textarea", required: true, hint: "Who, what, where, why. Keep it simple." },
      ],
    },
    {
      id: "schedule",
      title: "Schedule",
      subtitle: "Dates & times (where forms go to die).",
      fields: [
        { key: "startDate", label: "Start date", type: "date", required: true },
        { key: "startTime", label: "Start time", type: "time", required: true },
        { key: "endDate", label: "End date", type: "date", required: true },
        { key: "endTime", label: "End time", type: "time", required: true },
        {
          key: "timezone",
          label: "Timezone",
          type: "select",
          required: true,
          options: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"],
        },
      ],
    },
    {
      id: "location",
      title: "Location",
      subtitle: "Where are anglers allowed to fish?",
      fields: [
        { key: "waterbody", label: "Waterbody / fishery name", type: "text", required: true, placeholder: "Lake Lanier" },
        { key: "city", label: "City", type: "text", required: true },
        { key: "state", label: "State", type: "select", required: true, options: US_STATES },
        {
          key: "waterbodyRestriction",
          label: "Fishing area",
          type: "select",
          required: true,
          options: ["Restricted to this waterbody only", "Multiple waterbodies allowed", "Open (any waterbody)"],
        },
        {
          key: "waterbodyNotes",
          label: "If multiple/open, list boundaries / allowed waters",
          type: "textarea",
          hint: "Example: Any public waters in GA; or list specific lakes.",
        },
      ],
    },
    {
      id: "species_scoring",
      title: "Species & scoring",
      subtitle: "How winners are determined.",
      fields: [
        {
          key: "species",
          label: "Target species",
          type: "multi",
          required: true,
          options: ["Largemouth Bass", "Smallmouth Bass", "Walleye", "Muskie", "Trout", "Redfish", "Catfish", "Crappie", "Other"],
        },
        {
          key: "scoringMethod",
          label: "Scoring method",
          type: "select",
          required: true,
          options: ["Longest Fish", "Best 5 Fish", "Total Inches", "Heaviest Fish", "Other"],
        },
        { key: "scoringOther", label: "If other, describe scoring", type: "textarea" },
        { key: "minLength", label: "Minimum length (inches) (optional)", type: "number", placeholder: "Example: 14" },
      ],
    },
    {
      id: "entry_prizes",
      title: "Entry & prizes",
      subtitle: "Money and motivation.",
      fields: [
        { key: "entryFee", label: "Entry fee", type: "number", required: true, hint: "Use 0 for free." },
        { key: "maxParticipants", label: "Max participants (optional)", type: "number" },
        { key: "registrationDeadline", label: "Registration deadline", type: "date", required: true },
        { key: "paymentMethod", label: "Payment method", type: "select", required: true, options: ["Online", "On-site", "Both"] },
        { key: "paymentLink", label: "Payment link (if online)", type: "text", placeholder: "https://..." },
        { key: "prizeStructure", label: "Prize structure", type: "textarea", required: true, hint: "Example: 1st $500, 2nd $250, Big Fish $100" },
        { key: "randomPrizes", label: "Random prizes?", type: "select", required: true, options: ["No", "Yes"] },
        { key: "randomPrizesNotes", label: "If yes, describe random prizes", type: "textarea" },
      ],
    },
    {
      id: "rules_sponsors",
      title: "Rules & sponsors",
      subtitle: "Anything that needs to be crystal clear.",
      fields: [
        { key: "specialRules", label: "Special rules (optional)", type: "textarea", hint: "Kayak-only, artificial-only, shore fishing allowed, etc." },
        { key: "sponsorNames", label: "Sponsor names (optional)", type: "textarea", hint: "Comma-separated is fine." },
        { key: "logoLinks", label: "Logo links (optional)", type: "textarea", hint: "Paste image URLs (one per line) if you have them." },
      ],
    },
    {
      id: "wildcard",
      title: "Wildcard (optional)",
      subtitle: "Fun, chaotic, and strangely effective.",
      fields: [
        { key: "wantsWildcard", label: "Do you want a wildcard prize?", type: "select", required: true, options: ["No", "Yes"] },
        { key: "wildcardNotes", label: "If yes, describe it", type: "textarea", hint: 'Example: "First fish exactly 18 inches wins"' },
      ],
    },
    {
      id: "review",
      title: "Review & submit",
      subtitle: "One last sanity check.",
      fields: [],
    },
  ];
}

// Validation schema (lightweight but useful)
const schema = z.object({
  organizerName: z.string().min(1, "Name is required."),
  organizerEmail: z.string().email("Valid email is required."),
  organizerPhone: z.string().min(1, "Phone is required."),
  tournamentName: z.string().min(1, "Tournament name is required."),
  tournamentType: z.string().min(1, "Tournament type is required."),
  description: z.string().min(1, "Description is required."),
  startDate: z.string().min(1, "Start date is required."),
  startTime: z.string().min(1, "Start time is required."),
  endDate: z.string().min(1, "End date is required."),
  endTime: z.string().min(1, "End time is required."),
  timezone: z.string().min(1, "Timezone is required."),
  waterbody: z.string().min(1, "Waterbody is required."),
  city: z.string().min(1, "City is required."),
  state: z.string().min(1, "State is required."),
  waterbodyRestriction: z.string().min(1, "Fishing area selection is required."),
  species: z.array(z.string()).min(1, "Select at least one species."),
  scoringMethod: z.string().min(1, "Scoring method is required."),
  entryFee: z.string().min(1, "Entry fee is required."),
  registrationDeadline: z.string().min(1, "Registration deadline is required."),
  prizeStructure: z.string().min(1, "Prize structure is required."),
  randomPrizes: z.string().min(1, "Random prizes selection is required."),
  wantsWildcard: z.string().min(1, "Wildcard selection is required."),
});

type FormState = Record<string, any>;

function inputStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 14,
    border: `1px solid ${BRAND.border}`,
    outline: "none",
    fontSize: 14,
    background: BRAND.card,
    color: BRAND.text,
  } as const;
}

function labelStyle() {
  return { fontSize: 13, fontWeight: 600, color: BRAND.text } as const;
}

function hintStyle() {
  return { fontSize: 12, color: BRAND.muted } as const;
}

function errorStyle() {
  return { fontSize: 12, color: BRAND.danger, marginTop: 6 } as const;
}

export default function App() {
  const steps = useMemo(() => buildSteps(), []);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; msg: string }>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>(() => {
    const raw = localStorage.getItem("tournament_intake_v1");
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return {
      isDirector: "Yes",
      tournamentType: "Charity Event",
      timezone: "America/New_York",
      state: "GA",
      waterbodyRestriction: "Restricted to this waterbody only",
      species: [],
      scoringMethod: "Longest Fish",
      randomPrizes: "No",
      wantsWildcard: "No",
      entryFee: "0",
    };
  });

  // autosave
  useMemo(() => {
    localStorage.setItem("tournament_intake_v1", JSON.stringify(form));
    return null;
  }, [form]);

  function setValue(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateCurrentStep(): boolean {
    const step = steps[stepIdx];
    const nextErrors: Record<string, string> = {};

    // Validate only fields on this step using the global schema (where applicable)
    // If review step, validate everything.
    const keysToValidate = step.id === "review"
      ? Object.keys(schema.shape)
      : step.fields.map((f) => f.key).filter((k) => k in schema.shape);

    const partial: any = {};
    for (const key of keysToValidate) partial[key] = form[key];

    const pickSchema = schema.pick(Object.fromEntries(keysToValidate.map((k) => [k, true])) as any);
    const r = pickSchema.safeParse(partial);

    if (!r.success) {
      for (const issue of r.error.issues) {
        const key = issue.path[0] as string;
        nextErrors[key] = issue.message;
      }
    }

    // conditional rules
    if (form.isDirector === "No" && !String(form.directorName || "").trim()) nextErrors["directorName"] = "Director name is required.";
    if ((form.paymentMethod === "Online" || form.paymentMethod === "Both") && !String(form.paymentLink || "").trim()) nextErrors["paymentLink"] = "Payment link is required for online payments.";
    if (form.waterbodyRestriction !== "Restricted to this waterbody only" && !String(form.waterbodyNotes || "").trim())
      nextErrors["waterbodyNotes"] = "Please list boundaries / allowed waters.";
    if (form.scoringMethod === "Other" && !String(form.scoringOther || "").trim()) nextErrors["scoringOther"] = "Please describe the scoring method.";
    if (form.randomPrizes === "Yes" && !String(form.randomPrizesNotes || "").trim()) nextErrors["randomPrizesNotes"] = "Describe the random prizes.";
    if (form.wantsWildcard === "Yes" && !String(form.wildcardNotes || "").trim()) nextErrors["wildcardNotes"] = "Describe the wildcard prize.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    setResult(null);
    setErrors({});
    const ok = validateCurrentStep();
    if (!ok) return;

    if (!WEBHOOK_URL || WEBHOOK_URL.includes("PASTE_")) {
      setResult({ ok: false, msg: "Webhook URL is not set yet. Next step is creating the Google Sheets + email endpoint." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submittedAt: new Date().toISOString(),
          form,
          userAgent: navigator.userAgent,
          referrer: document.referrer || null,
        }),
      });

      if (!res.ok) throw new Error(`Submission failed (${res.status}).`);
      const data = await res.json().catch(() => ({}));

      setResult({ ok: true, msg: data?.message || "Submitted! We’ll review and follow up if anything is unclear." });
      localStorage.removeItem("tournament_intake_v1");
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || "Submission failed." });
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    setResult(null);
    const ok = validateCurrentStep();
    if (!ok) return;
    setStepIdx((s) => Math.min(s + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setResult(null);
    setErrors({});
    setStepIdx((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const step = steps[stepIdx];
  const progress = Math.round(((stepIdx + 1) / steps.length) * 100);

  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg, fontFamily: BRAND.fontFamily }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px 40px" }}>
        <header style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.text }}>{BRAND.title}</div>
          <div style={{ marginTop: 6, color: BRAND.muted }}>{BRAND.subtitle}</div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: BRAND.muted }}>
              <span>
                Step {stepIdx + 1} of {steps.length}: <b style={{ color: BRAND.text }}>{step.title}</b>
              </span>
              <span>{progress}%</span>
            </div>
            <div style={{ marginTop: 8, height: 8, background: BRAND.border, borderRadius: 999 }}>
              <div style={{ width: `${progress}%`, height: 8, background: BRAND.primary, borderRadius: 999 }} />
            </div>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
          <aside style={{ alignSelf: "start" }}>
            <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 18, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.text, marginBottom: 10 }}>Steps</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {steps.map((s, idx) => {
                  const active = idx === stepIdx;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { if (idx <= stepIdx) setStepIdx(idx); }}
                      style={{
                        textAlign: "left",
                        padding: "10px 10px",
                        borderRadius: 14,
                        border: `1px solid ${active ? BRAND.primary : BRAND.border}`,
                        background: active ? BRAND.primary : BRAND.bg,
                        color: active ? "#fff" : BRAND.text,
                        cursor: idx <= stepIdx ? "pointer" : "default",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.title}</div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>{s.subtitle || ""}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("tournament_intake_v1");
                location.reload();
              }}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 18,
                border: `1px solid ${BRAND.border}`,
                background: BRAND.card,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Reset draft
            </button>
          </aside>

          <main>
            <div style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: BRAND.text }}>{step.title}</div>
              {step.subtitle ? <div style={{ marginTop: 6, color: BRAND.muted }}>{step.subtitle}</div> : null}

              <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
                {step.id === "review" ? (
                  <div>
                    <div style={{ color: BRAND.muted, fontSize: 13, marginBottom: 10 }}>
                      Review your answers below. If it looks right, submit.
                    </div>
                    <pre style={{ background: "#0b1220", color: "#e2e8f0", padding: 12, borderRadius: 14, overflow: "auto", fontSize: 12 }}>
                      {JSON.stringify(form, null, 2)}
                    </pre>
                  </div>
                ) : (
                  step.fields.map((f) => {
                    // conditional hide:
                    if (f.key === "directorName" && form.isDirector !== "No") return null;
                    if (f.key === "paymentLink" && !(form.paymentMethod === "Online" || form.paymentMethod === "Both")) return null;
                    if (f.key === "waterbodyNotes" && form.waterbodyRestriction === "Restricted to this waterbody only") return null;
                    if (f.key === "scoringOther" && form.scoringMethod !== "Other") return null;
                    if (f.key === "randomPrizesNotes" && form.randomPrizes !== "Yes") return null;
                    if (f.key === "wildcardNotes" && form.wantsWildcard !== "Yes") return null;

                    const err = errors[f.key];

                    return (
                      <div key={f.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={labelStyle()}>
                            {f.label} {f.required ? <span style={{ color: BRAND.danger }}>*</span> : null}
                          </div>
                          {f.hint ? <div style={hintStyle()}>{f.hint}</div> : null}
                        </div>

                        <div style={{ marginTop: 8 }}>
                          {f.type === "select" ? (
                            <select
                              style={inputStyle()}
                              value={String(form[f.key] ?? "")}
                              onChange={(e) => setValue(f.key, e.target.value)}
                            >
                              <option value="" disabled>Choose…</option>
                              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : f.type === "multi" ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              {f.options.map((o) => {
                                const selected: string[] = Array.isArray(form[f.key]) ? form[f.key] : [];
                                const checked = selected.includes(o);
                                return (
                                  <label key={o} style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 10px", borderRadius: 14, border: `1px solid ${BRAND.border}`, background: BRAND.bg }}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const next = checked ? selected.filter((x) => x !== o) : [...selected, o];
                                        setValue(f.key, next);
                                      }}
                                    />
                                    <span style={{ fontSize: 13 }}>{o}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : f.type === "textarea" ? (
                            <textarea
                              style={{ ...inputStyle(), minHeight: 120 }}
                              value={String(form[f.key] ?? "")}
                              placeholder={(f as TextField).placeholder || ""}
                              onChange={(e) => setValue(f.key, e.target.value)}
                            />
                          ) : (
                            <input
                              style={inputStyle()}
                              type={f.type === "phone" ? "tel" : f.type}
                              value={String(form[f.key] ?? "")}
                              placeholder={(f as TextField).placeholder || ""}
                              onChange={(e) => setValue(f.key, e.target.value)}
                            />
                          )}
                        </div>

                        {err ? <div style={errorStyle()}>{err}</div> : null}
                      </div>
                    );
                  })
                )}
              </div>

              {result ? (
                <div style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: `1px solid ${result.ok ? "#bbf7d0" : "#fecdd3"}`,
                  background: result.ok ? "#ecfdf5" : "#fff1f2",
                  color: BRAND.text,
                  fontSize: 13,
                }}>
                  {result.msg}
                </div>
              ) : null}

              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <button
                    onClick={back}
                    disabled={stepIdx === 0 || submitting}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 16,
                      border: `1px solid ${BRAND.border}`,
                      background: BRAND.card,
                      color: BRAND.text,
                      cursor: stepIdx === 0 || submitting ? "not-allowed" : "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Back
                  </button>

                {stepIdx < steps.length - 1 ? (
                  <button
                    onClick={next}
                    disabled={submitting}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 16,
                      border: "none",
                      background: BRAND.primary,
                      color: "#fff",
                      cursor: submitting ? "not-allowed" : "pointer",
                      fontWeight: 900,
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={submitting}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 16,
                      border: "none",
                      background: BRAND.primary,
                      color: "#fff",
                      cursor: submitting ? "not-allowed" : "pointer",
                      fontWeight: 900,
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>

        <div style={{ marginTop: 10, color: BRAND.muted, fontSize: 12 }}>
          Tip: This saves progress automatically. Even if they close the tab, their draft survives. Like a cockroach, but helpful.
        </div>
      </div>
    </div>
  );
}