import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwiM7VJRYhK11l3ydp-8QR4wJKfxW12-DFQmkGYug2lsF7VLpdqj74a7b7Xnx3Wkrc9/exec";

const BRAND = {
  title: "Tournament Setup Intake",
  subtitle: "Answer a few quick questions and we’ll help you set everything up.",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
  type: "text" | "email" | "phone" | "number" | "textarea" | "url";
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
      id: "event_info",
      title: "Tell us about your event",
      subtitle: "We’ll use this to understand what kind of tournament you want to run.",
      fields: [
        { key: "yourName", label: "Your name", type: "text", required: true, placeholder: "John Smith" },
        { key: "email", label: "Email", type: "email", required: true, placeholder: "john@email.com" },
        { key: "phone", label: "Phone number", type: "phone", required: true, placeholder: "(555) 555-5555" },
        { key: "organizationName", label: "Organization / group name", type: "text", required: true, placeholder: "Example Charity Foundation" },
        { key: "organizationWebsite", label: "Organization website (optional)", type: "url", placeholder: "https://example.org" },
        { key: "tournamentName", label: "Tournament name", type: "text", required: true, placeholder: "2026 Charity Bass Bash" },
        {
          key: "eventType",
          label: "Event type",
          type: "select",
          required: true,
          options: [
            "Charity / Fundraiser",
            "Friendly / Fun Event",
            "Sponsored Event",
            "Club Tournament",
            "Other",
          ],
        },
        { key: "eventDescription", label: "Short description", type: "textarea", required: true, hint: "What’s this event for?" },
      ],
    },
    {
      id: "timing",
      title: "When is it happening?",
      subtitle: "Set the event timing.",
      fields: [
        { key: "startDate", label: "Start date", type: "date", required: true },
        { key: "startTime", label: "Start time", type: "time", required: true },
        { key: "endDate", label: "End date", type: "date", required: true },
        { key: "endTime", label: "End time", type: "time", required: true },
      ],
    },
    {
      id: "location",
      title: "Where will people fish?",
      subtitle: "Tell us what kind of fishing area the tournament will cover.",
      fields: [
        {
          key: "locationType",
          label: "Fishing area type",
          type: "select",
          required: true,
          options: [
            "Single waterbody",
            "Multiple waterbodies",
            "Statewide / regional area",
            "Not sure — help me define it",
          ],
        },
        {
          key: "waterbody",
          label: "Waterbody / area name",
          type: "text",
          placeholder: "Example: Lake Lanier",
        },
        {
          key: "city",
          label: "City",
          type: "text",
          placeholder: "Example: Gainesville",
        },
        {
          key: "state",
          label: "State",
          type: "select",
          options: US_STATES,
        },
        {
          key: "areaDescription",
          label: "Describe the fishing area",
          type: "textarea",
          hint: "Example: Any public waters in Georgia, or list the lakes/region anglers may fish.",
        },
      ],
    },
    {
      id: "species",
      title: "What are people fishing for?",
      subtitle: "Select the species that should count.",
      fields: [
        {
          key: "species",
          label: "Species",
          type: "multi",
          required: true,
          hint: 'Don’t see your species? Select "Other" and type it in below.',
          options: ["Bass", "Walleye", "Trout", "Redfish", "Other", "Not sure — recommend for me"],
        },
        { key: "otherSpecies", label: 'If you selected "Other", enter species', type: "text", placeholder: "Example: Crappie" },
      ],
    },
    {
      id: "winners",
      title: "How will winners be decided?",
      subtitle: "Pick the option that best fits your event.",
      fields: [
        {
          key: "winnerMethod",
          label: "Winner method",
          type: "select",
          required: true,
          options: [
            "Biggest single fish wins",
            "Best 3–5 fish combined",
            "Total length of all fish",
            "Not sure — recommend for me",
            "Other",
          ],
        },
        {
          key: "winnerMethodOther",
          label: 'If you selected "Other", describe how winners should be decided',
          type: "textarea",
          placeholder: "Describe the scoring format",
        },
      ],
    },
    {
      id: "entry_prizes",
      title: "Entry & prizes",
      subtitle: "Tell us whether the event is free or paid, plus any prize details.",
      fields: [
        {
          key: "entryType",
          label: "Entry fee",
          type: "select",
          required: true,
          options: ["Free", "Paid"],
        },
        { key: "entryFeeAmount", label: "Entry fee amount", type: "number", placeholder: "Example: 25" },
        {
          key: "prizeDescription",
          label: "Prize description (optional)",
          type: "textarea",
          hint: "Example: $500 for first place, prizes for top 3, etc.",
        },
      ],
    },
    {
      id: "extra_info",
      title: "Anything else we should know?",
      subtitle: "Add any extra details that will help us set this up.",
      fields: [
        { key: "specialRules", label: "Special rules (optional)", type: "textarea" },
        { key: "sponsors", label: "Sponsors (optional)", type: "textarea", hint: "List sponsor names if applicable." },
        {
          key: "sponsorLogoNotes",
          label: "Sponsor logos (optional)",
          type: "textarea",
          hint: "Paste logo links here, or note that you’ll email them to us after submission.",
        },
        { key: "additionalNotes", label: "Additional notes (optional)", type: "textarea" },
      ],
    },
    {
      id: "follow_up",
      title: "How should we follow up?",
      subtitle: "We usually review the submission and reach out to finalize details.",
      fields: [
        {
          key: "followUpPreference",
          label: "Follow-up preference",
          type: "select",
          required: true,
          options: ["Phone call", "Email", "Either is fine"],
        },
      ],
    },
    {
      id: "review",
      title: "Review & submit",
      subtitle: "Take one last look before sending it over.",
      fields: [],
    },
  ];
}

const schema = z.object({
  yourName: z.string().min(1, "Your name is required."),
  email: z.string().email("Valid email is required."),
  phone: z.string().min(1, "Phone number is required."),
  organizationName: z.string().min(1, "Organization / group name is required."),
  tournamentName: z.string().min(1, "Tournament name is required."),
  eventType: z.string().min(1, "Event type is required."),
  eventDescription: z.string().min(1, "Description is required."),
  startDate: z.string().min(1, "Start date is required."),
  startTime: z.string().min(1, "Start time is required."),
  endDate: z.string().min(1, "End date is required."),
  endTime: z.string().min(1, "End time is required."),
  locationType: z.string().min(1, "Fishing area type is required."),
  species: z.array(z.string()).min(1, "Please select at least one species."),
  winnerMethod: z.string().min(1, "Winner method is required."),
  entryType: z.string().min(1, "Entry fee selection is required."),
  followUpPreference: z.string().min(1, "Follow-up preference is required."),
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
    boxSizing: "border-box" as const,
  };
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

function sectionCardStyle() {
  return {
    background: BRAND.card,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    padding: 18,
    width: "100%",
    boxSizing: "border-box" as const,
  };
}

function formatValue(value: any): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function todayLocalDateString() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().split("T")[0];
}

function combineDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const combined = new Date(`${dateStr}T${timeStr}`);
  return Number.isNaN(combined.getTime()) ? null : combined;
}

export default function App() {
  const steps = useMemo(() => buildSteps(), []);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; msg: string }>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>(() => {
    const raw = localStorage.getItem("tournament_intake_v3");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return {
      eventType: "Charity / Fundraiser",
      locationType: "Single waterbody",
      state: "GA",
      species: [],
      entryType: "Free",
      followUpPreference: "Phone call",
    };
  });

  useEffect(() => {
    localStorage.setItem("tournament_intake_v3", JSON.stringify(form));
  }, [form]);

  function setValue(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateCurrentStep(): boolean {
    const step = steps[stepIdx];
    const nextErrors: Record<string, string> = {};

    const keysToValidate =
      step.id === "review"
        ? Object.keys(schema.shape)
        : step.fields.map((f) => f.key).filter((k) => k in schema.shape);

    const partial: any = {};
    for (const key of keysToValidate) partial[key] = form[key];

    const pickSchema = schema.pick(
      Object.fromEntries(keysToValidate.map((k) => [k, true])) as any
    );

    const parsed = pickSchema.safeParse(partial);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        nextErrors[key] = issue.message;
      }
    }

    if (Array.isArray(form.species) && form.species.includes("Other") && !String(form.otherSpecies || "").trim()) {
      nextErrors.otherSpecies = 'Please enter the species if you selected "Other".';
    }

    if (form.winnerMethod === "Other" && !String(form.winnerMethodOther || "").trim()) {
      nextErrors.winnerMethodOther = 'Please describe the winner method if you selected "Other".';
    }

    if (form.entryType === "Paid" && !String(form.entryFeeAmount || "").trim()) {
      nextErrors.entryFeeAmount = "Please enter the entry fee amount.";
    }

    if (form.locationType === "Single waterbody") {
      if (!String(form.waterbody || "").trim()) nextErrors.waterbody = "Please enter the waterbody name.";
      if (!String(form.city || "").trim()) nextErrors.city = "Please enter the city.";
      if (!String(form.state || "").trim()) nextErrors.state = "Please select the state.";
    }

    if (form.locationType === "Multiple waterbodies" || form.locationType === "Statewide / regional area") {
      if (!String(form.areaDescription || "").trim()) {
        nextErrors.areaDescription = "Please describe the fishing area.";
      }
      if (!String(form.state || "").trim()) nextErrors.state = "Please select the state.";
    }

    if (form.locationType === "Not sure — help me define it") {
      if (!String(form.areaDescription || "").trim()) {
        nextErrors.areaDescription = "Give us a quick description so we can help define it.";
      }
    }

    const today = todayLocalDateString();

    if (form.startDate && form.startDate < today) {
      nextErrors.startDate = "Start date cannot be in the past.";
    }

    if (form.endDate && form.endDate < today) {
      nextErrors.endDate = "End date cannot be in the past.";
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.endDate = "End date cannot be before the start date.";
    }

    if (form.startDate && form.endDate && form.startDate === form.endDate && form.startTime && form.endTime) {
      const start = combineDateTime(form.startDate, form.startTime);
      const end = combineDateTime(form.endDate, form.endTime);
      if (start && end && end < start) {
        nextErrors.endTime = "End time cannot be earlier than the start time on the same day.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    setResult(null);
    setErrors({});
    const ok = validateCurrentStep();
    if (!ok) return;

    setSubmitting(true);

    try {
      const payload = {
        submittedAt: new Date().toISOString(),
        form,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
      };

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Submission failed (${res.status}).`);

      const data = await res.json().catch(() => ({}));

      setResult({
        ok: true,
        msg: data?.message || "Submitted successfully. We’ll review it and follow up soon.",
      });

      localStorage.removeItem("tournament_intake_v3");
    } catch (e: any) {
      setResult({
        ok: false,
        msg: e?.message || "Submission failed.",
      });
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
  const todayMin = todayLocalDateString();

  const reviewRows = [
    ["Your name", form.yourName],
    ["Email", form.email],
    ["Phone", form.phone],
    ["Organization / group name", form.organizationName],
    ["Organization website", form.organizationWebsite],
    ["Tournament name", form.tournamentName],
    ["Event type", form.eventType],
    ["Short description", form.eventDescription],
    ["Start date", form.startDate],
    ["Start time", form.startTime],
    ["End date", form.endDate],
    ["End time", form.endTime],
    ["Fishing area type", form.locationType],
    ["Waterbody / area name", form.waterbody],
    ["City", form.city],
    ["State", form.state],
    ["Area description", form.areaDescription],
    ["Species", form.species],
    ["Other species", form.otherSpecies],
    ["How winners will be decided", form.winnerMethod],
    ["Winner method (other)", form.winnerMethodOther],
    ["Entry fee", form.entryType],
    ["Entry fee amount", form.entryType === "Paid" ? form.entryFeeAmount : "N/A"],
    ["Prize description", form.prizeDescription],
    ["Special rules", form.specialRules],
    ["Sponsors", form.sponsors],
    ["Sponsor logo notes", form.sponsorLogoNotes],
    ["Additional notes", form.additionalNotes],
    ["Follow-up preference", form.followUpPreference],
  ];

  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg, fontFamily: BRAND.fontFamily }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 16px 40px" }}>
        <header style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.text }}>{BRAND.title}</div>
          <div style={{ marginTop: 6, color: BRAND.muted }}>{BRAND.subtitle}</div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: BRAND.muted }}>
              <span>
                Step {stepIdx + 1} of {steps.length}:{" "}
                <b style={{ color: BRAND.text }}>{step.title}</b>
              </span>
              <span>{progress}%</span>
            </div>
            <div style={{ marginTop: 8, height: 8, background: BRAND.border, borderRadius: 999 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: 8,
                  background: BRAND.primary,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px minmax(0, 760px)",
            gap: 16,
            alignItems: "start",
            justifyContent: "center",
          }}
        >
          <aside style={{ alignSelf: "start", width: 280 }}>
            <div style={{ ...sectionCardStyle(), padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.text, marginBottom: 10 }}>
                Steps
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {steps.map((s, idx) => {
                  const active = idx === stepIdx;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (idx <= stepIdx) setStepIdx(idx);
                      }}
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
                localStorage.removeItem("tournament_intake_v3");
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
                color: BRAND.text,
              }}
            >
              Reset draft
            </button>
          </aside>

          <main style={{ width: "100%", minWidth: 0 }}>
            <div style={sectionCardStyle()}>
              <div style={{ fontSize: 18, fontWeight: 800, color: BRAND.text }}>{step.title}</div>
              {step.subtitle ? (
                <div style={{ marginTop: 6, color: BRAND.muted }}>{step.subtitle}</div>
              ) : null}

              <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
                {step.id === "review" ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ color: BRAND.muted, fontSize: 13 }}>
                      Please review your information below before submitting.
                    </div>

                    <div
                      style={{
                        border: `1px solid ${BRAND.border}`,
                        borderRadius: 14,
                        overflow: "hidden",
                        background: BRAND.card,
                      }}
                    >
                      {reviewRows.map(([label, value], idx) => (
                        <div
                          key={String(label)}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "220px 1fr",
                            gap: 12,
                            padding: "12px 14px",
                            borderTop: idx === 0 ? "none" : `1px solid ${BRAND.border}`,
                            background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.text }}>{label}</div>
                          <div style={{ fontSize: 13, color: BRAND.text }}>{formatValue(value)}</div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: "#f8fafc",
                        border: `1px solid ${BRAND.border}`,
                        color: BRAND.text,
                        fontSize: 13,
                      }}
                    >
                      Thanks — we’ve got what we need. We’ll review your submission and reach out to finalize your
                      tournament. Most events are completed with a quick 5–10 minute call.
                    </div>
                  </div>
                ) : (
                  step.fields.map((f) => {
                    if (f.key === "otherSpecies" && !(Array.isArray(form.species) && form.species.includes("Other"))) {
                      return null;
                    }

                    if (f.key === "winnerMethodOther" && form.winnerMethod !== "Other") {
                      return null;
                    }

                    if (f.key === "entryFeeAmount" && form.entryType !== "Paid") {
                      return null;
                    }

                    if (f.key === "waterbody" && form.locationType !== "Single waterbody") {
                      return null;
                    }

                    if (f.key === "city" && form.locationType !== "Single waterbody") {
                      return null;
                    }

                    if (f.key === "state" && form.locationType === "Not sure — help me define it") {
                      return null;
                    }

                    if (
                      f.key === "areaDescription" &&
                      form.locationType === "Single waterbody"
                    ) {
                      return null;
                    }

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
                              <option value="" disabled>
                                Choose…
                              </option>
                              {f.options.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          ) : f.type === "multi" ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              {f.options.map((o) => {
                                const selected: string[] = Array.isArray(form[f.key]) ? form[f.key] : [];
                                const checked = selected.includes(o);
                                return (
                                  <label
                                    key={o}
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      alignItems: "center",
                                      padding: "10px 10px",
                                      borderRadius: 14,
                                      border: `1px solid ${BRAND.border}`,
                                      background: BRAND.bg,
                                      color: BRAND.text,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const next = checked
                                          ? selected.filter((x) => x !== o)
                                          : [...selected, o];
                                        setValue(f.key, next);
                                      }}
                                    />
                                    <span style={{ fontSize: 13, color: BRAND.text }}>{o}</span>
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
                              min={f.type === "date" ? todayMin : undefined}
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
                <div
                  style={{
                    marginTop: 14,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: `1px solid ${result.ok ? "#bbf7d0" : "#fecdd3"}`,
                    background: result.ok ? "#ecfdf5" : "#fff1f2",
                    color: BRAND.text,
                    fontSize: 13,
                  }}
                >
                  {result.msg}
                </div>
              ) : null}

              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  {stepIdx > 0 ? (
                    <button
                      onClick={back}
                      disabled={submitting}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 16,
                        border: `1px solid ${BRAND.border}`,
                        background: BRAND.card,
                        color: BRAND.text,
                        cursor: submitting ? "not-allowed" : "pointer",
                        fontWeight: 800,
                      }}
                    >
                      Back
                    </button>
                  ) : null}
                </div>

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
          Tip: Your progress is saved automatically in this browser.
        </div>
      </div>
    </div>
  );
}
