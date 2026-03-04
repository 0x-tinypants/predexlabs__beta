import { useState, useEffect } from "react";
import type { Wager, DeclaredDirection } from "../types";
import { COURSE_STUBS } from "../../data/courses.temp";
import ContractShell from "../../ui/contract/ContractShell";
import "./contract-layout.css";
import "./OpenBetForm.css";

type OpenBetFormProps = {
  category: string;
  onSubmit: (wager: Wager) => void;
  onCancel: () => void;
  demoSeed?: any;
};

export default function OpenBetForm({
  category,
  onSubmit,
  onCancel,
  demoSeed,
}: OpenBetFormProps) {
  /* =========================
     EVENT
  ========================= */
  const [eventName, setEventName] = useState("");
  const [round, setRound] = useState("");

  /* =========================
     COURSE
  ========================= */
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseLocation, setCourseLocation] = useState("");

  const [teeName, setTeeName] = useState("");
  const [par, setPar] = useState("");
  const [yardage, setYardage] = useState("");

  /* =========================
     ASSERTION
  ========================= */
  const [declaredDirection, setDeclaredDirection] =
    useState<DeclaredDirection | null>(null);

  const [line, setLine] = useState("");
  const [description, setDescription] = useState("");

  /* =========================
     EXPOSURE
  ========================= */
  const [maxExposure, setMaxExposure] = useState("");
  const exposureValue = Number(maxExposure) || 0;

  const minPer = Math.max(5, Math.floor(exposureValue * 0.05));
  const maxPer = Math.floor(exposureValue * 0.1);

  /* =========================
     TIMING & VERIFICATION
  ========================= */
  const [deadline, setDeadline] = useState("");
  const [resolutionMethod, setResolutionMethod] =
    useState<"user" | "verified" | null>(null);

  const [referenceLink, setReferenceLink] = useState("");

  /* =========================
     DEMO SEED
  ========================= */
  useEffect(() => {
    if (!demoSeed) return;

    setEventName(demoSeed.eventName ?? "");
    setRound(String(demoSeed.round ?? ""));

    if (demoSeed.course) {
      const selected = COURSE_STUBS.find(
        (c) => c.name === demoSeed.course
      );

      if (selected) {
        setCourseId(selected.id);
        setCourseName(selected.name);
        setCourseLocation(`${selected.city}, ${selected.state}`);
      }
    }

    setTeeName(demoSeed.tee ?? "");
    setPar(String(demoSeed.par ?? ""));
    setYardage(String(demoSeed.yardage ?? ""));
    setDeclaredDirection(demoSeed.declaredDirection ?? null);
    setLine(String(demoSeed.line ?? ""));
    setDescription(demoSeed.description ?? "");
    setMaxExposure(String(demoSeed.maxLoss ?? ""));

    setDeadline(
      new Date(Date.now() + 1000 * 60 * 60)
        .toISOString()
        .slice(0, 16)
    );

    setResolutionMethod("user");
  }, [demoSeed]);

  /* =========================
     VALIDATION
  ========================= */
  const canCreate =
    eventName &&
    courseId &&
    teeName &&
    par &&
    yardage &&
    declaredDirection &&
    line &&
    description &&
    exposureValue > 0 &&
    deadline &&
    resolutionMethod;

  /* =========================
     CREATE
  ========================= */
  function handleCreate() {
    if (!canCreate) return;

    const selectedCourse = COURSE_STUBS.find(c => c.id === courseId);

    const selectedTee = selectedCourse?.tees.find(
      t => t.teeName === teeName
    );

    const wager: Wager = {
      id: crypto.randomUUID(),
      creatorId: "u1",
      creatorUsername: "tinypants",
      type: "over_under",

      exposure: {
        maxLoss: exposureValue,
        minPerParticipant: minPer,
        maxPerParticipant: maxPer,
      },

      context: {
        category,
        descriptor: "Golf",
      },

      definition: {
        description,
        line,
        deadline: new Date(deadline).toISOString(),
        declaredDirection,
        resolutionLink:
          resolutionMethod === "verified"
            ? referenceLink || undefined
            : undefined,
      },

      participants: { mode: "open" },

      totals: {
        committed: 0,
        remaining: exposureValue,
      },

      status: "open",

      resolution: { state: "NONE" },

      viewer: {
        isCreator: true,
        isParticipant: true,
      },

      createdAt: new Date().toISOString(),

      eventName:
        round.trim() !== ""
          ? `${eventName} — ${round}`
          : eventName,

      referenceLink: referenceLink || undefined,

      courseContext: {
        courseId,
        courseName,
        courseLocation,
        teeName,
        par: Number(par),
        yardage: Number(yardage),
        courseRating: selectedTee?.courseRating ?? 0,
        slopeRating: selectedTee?.slopeRating ?? 0,
        declaredBy: "creator",
      },
    };

    onSubmit(wager);
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <ContractShell title="Open Bet — Golf Performance">
      <div className="ob-container">
        <div className="ob-grid">

          {/* LEFT PANEL */}
          <div className="ob-panel">
            <div className="ob-section">
              <label>Event</label>
              <div className="ob-row">
                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Event Name"
                />
                <input
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  placeholder="R"
                  className="small"
                />
              </div>
            </div>

            <div className="ob-section">
              <label>Course</label>
              <select
                value={courseId}
                onChange={(e) => {
                  const selected = COURSE_STUBS.find(
                    (c) => c.id === e.target.value
                  );
                  if (!selected) return;

                  setCourseId(selected.id);
                  setCourseName(selected.name);
                  setCourseLocation(`${selected.city}, ${selected.state}`);
                }}
              >
                <option value="">Select Course</option>
                {COURSE_STUBS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="ob-row compact">
                <input
                  value={teeName}
                  onChange={(e) => setTeeName(e.target.value)}
                  placeholder="Tee"
                />
                <input
                  value={par}
                  onChange={(e) => setPar(e.target.value)}
                  placeholder="Par"
                />
                <input
                  value={yardage}
                  onChange={(e) => setYardage(e.target.value)}
                  placeholder="Ydg"
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="ob-panel">
            <div className="ob-section">
              <label>Direction</label>
              <div className="ob-segmented">
                {["less", "more"].map((d) => (
                  <button
                    key={d}
                    className={`seg-btn ${declaredDirection === d ? "active" : ""
                      }`}
                    onClick={() =>
                      setDeclaredDirection(d as DeclaredDirection)
                    }
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="ob-section">
              <label>Line</label>
              <input
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder="72.5"
              />
            </div>

            <div className="ob-section">
              <label>Condition</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Must shoot 72 or lower..."
              />
            </div>
          </div>

          {/* BOTTOM PANEL */}
          <div className="ob-panel full">
            <div className="ob-section">
              <label>Exposure</label>
              <input
                type="range"
                min={5}
                max={1240}
                value={exposureValue}
                onChange={(e) => setMaxExposure(e.target.value)}
              />
              <div className="exposure-meta">
                <span>${exposureValue}</span>
                <span>
                  Min ${minPer} / Max ${maxPer}
                </span>
              </div>
            </div>

            <div className="ob-section">
              <label>Resolution</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />

              <div className="ob-segmented">
                {["user", "verified"].map((m) => (
                  <button
                    key={m}
                    className={`seg-btn ${resolutionMethod === m ? "active" : ""
                      }`}
                    onClick={() =>
                      setResolutionMethod(
                        m as "user" | "verified"
                      )
                    }
                  >
                    {m === "user" ? "ATTESTED" : "VERIFIED"}
                  </button>
                ))}
              </div>

              <input
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                placeholder="Reference link (optional)"
              />
            </div>

            <button
              className="ob-deploy"
              disabled={!canCreate}
              onClick={handleCreate}
            >
              Deploy Wager
            </button>
          </div>
        </div>
      </div>
    </ContractShell>
  );
}