
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Step = "welcome" | "family" | "members" | "email" | "payment";

const MEMBER_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [familyName, setFamilyName] = useState("");
  const [parentName, setParentName] = useState("");
  const [members, setMembers] = useState([{ name: "", role: "child", age: "", color: MEMBER_COLORS[0] }]);
  const [saving, setSaving] = useState(false);

  // If the user is already onboarded (profile + members), skip straight to dashboard.
  useEffect(() => {
    async function loadExisting() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("name,family_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setParentName(profile.name ?? "");
        setFamilyName(profile.family_name ?? "");
      }

      const { data: existingMembers } = await supabase
        .from("family_members")
        .select("id,name,role,age,color")
        .eq("user_id", user.id);

      if (existingMembers && existingMembers.length > 0) {
        router.push("/dashboard");
      }
    }

    loadExisting();
  }, [router]);

  const addMember = () => {
    if (members.length >= 6) return;
    setMembers([...members, { name: "", role: "child", age: "", color: MEMBER_COLORS[members.length] }]);
  };

  const updateMember = (i: number, field: string, value: string) => {
    setMembers(members.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const removeMember = (i: number) => setMembers(members.filter((_, idx) => idx !== i));

  const saveAndContinue = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/check-email");
      return;
    }

    await supabase.from("users").upsert({
      id: user.id, email: user.email,
      name: parentName, family_name: familyName,
    });

    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length > 0) {
      await supabase.from("family_members").insert(
        validMembers.map((m) => ({
          user_id: user.id, name: m.name,
          role: m.role, age: m.age ? parseInt(m.age) : null, color: m.color,
        }))
      );
    }
    setSaving(false);
    setStep("email");
  };

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="onboarding-progress">
          {["welcome", "family", "members", "email", "payment"].map((s, i) => (
            <div key={s} className={`progress-dot ${step === s ? "active" : i < ["welcome","family","members","email","payment"].indexOf(step) ? "done" : ""}`} />
          ))}
        </div>

        {step === "welcome" && (
          <div className="ob-step">
            <div className="ob-icon">🗓️</div>
            <h1 className="ob-title">Welcome to FamilyBrief</h1>
            <p className="ob-subtitle">Your family&apos;s AI chief of staff. We&apos;ll get you set up in 2 minutes.</p>
            <ul className="ob-benefits">
              <li><span>✉</span> Forward school emails — we turn them into calendar events</li>
              <li><span>📅</span> See your whole family&apos;s week at a glance</li>
              <li><span>☀️</span> Get a Sunday briefing so you&apos;re never caught off guard</li>
            </ul>
            <button className="ob-btn-primary" onClick={() => setStep("family")}>Let&apos;s go →</button>
          </div>
        )}

        {step === "family" && (
          <div className="ob-step">
            <h2 className="ob-title">Tell us about your family</h2>
            <p className="ob-subtitle">This helps personalise your weekly briefings.</p>
            <div className="form-field">
              <label>Your name</label>
              <input value={parentName} onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Sarah" autoFocus />
            </div>
            <div className="form-field">
              <label>Family name</label>
              <input value={familyName} onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. The Johnsons" />
            </div>
            <div className="ob-actions">
              <button className="ob-btn-secondary" onClick={() => setStep("welcome")}>← Back</button>
              <button className="ob-btn-primary"
                disabled={!parentName || !familyName}
                onClick={() => setStep("members")}>Continue →</button>
            </div>
          </div>
        )}

        {step === "members" && (
          <div className="ob-step">
            <h2 className="ob-title">Add your family members</h2>
            <p className="ob-subtitle">Add your children (and partner if you like) so events get colour-coded correctly.</p>
            <div className="members-list">
              {members.map((member, i) => (
                <div key={i} className="member-row">
                  <div className="member-color" style={{ background: member.color }} />
                  <input className="member-name-input"
                    value={member.name} placeholder="Name"
                    onChange={(e) => updateMember(i, "name", e.target.value)} />
                  <select className="member-role-select"
                    value={member.role} onChange={(e) => updateMember(i, "role", e.target.value)}>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                  </select>
                  <input className="member-age-input" type="number"
                    value={member.age} placeholder="Age"
                    onChange={(e) => updateMember(i, "age", e.target.value)} />
                  {members.length > 1 && (
                    <button className="member-remove" onClick={() => removeMember(i)}>×</button>
                  )}
                </div>
              ))}
            </div>
            {members.length < 6 && (
              <button className="ob-btn-add" onClick={addMember}>+ Add another</button>
            )}
            <div className="ob-actions">
              <button className="ob-btn-secondary" onClick={() => setStep("family")}>← Back</button>
              <button className="ob-btn-primary" disabled={saving} onClick={saveAndContinue}>
                {saving ? "Saving..." : "Continue →"}
              </button>
            </div>
          </div>
        )}

        {step === "email" && (
          <div className="ob-step">
            <div className="ob-icon">✉️</div>
            <h2 className="ob-title">Set up email forwarding</h2>
            <p className="ob-subtitle">Forward school and activity emails to your unique FamilyBrief address. We&apos;ll automatically turn them into calendar events.</p>
            <div className="email-box">
              <code className="inbound-email">family+your-id@inbound.familybrief.app</code>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText("family+your-id@inbound.familybrief.app")}>
                Copy
              </button>
            </div>
            <p className="ob-hint">You can also just forward emails manually anytime — or skip this and add events manually.</p>
            <div className="ob-actions">
              <button className="ob-btn-secondary" onClick={() => setStep("members")}>← Back</button>
              <button className="ob-btn-primary" onClick={() => setStep("payment")}>Continue →</button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="ob-step">
            <div className="ob-icon">🎉</div>
            <h2 className="ob-title">You&apos;re all set!</h2>
            <p className="ob-subtitle">Start your 7-day free trial. Cancel anytime.</p>
            <div className="pricing-card">
              <div className="pricing-top">
                <span className="pricing-amount">$5</span>
                <span className="pricing-period">/month</span>
              </div>
              <ul className="pricing-features">
                <li>✓ Unlimited family members</li>
                <li>✓ AI email parsing</li>
                <li>✓ Weekly Sunday briefing</li>
                <li>✓ Family calendar</li>
              </ul>
            </div>
            <button className="ob-btn-primary ob-btn-cta"
              onClick={() => router.push("/api/checkout")}>
              Start free trial →
            </button>
            <button className="ob-btn-ghost" onClick={() => router.push("/dashboard")}>
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
