import { useState } from "react";
import { COURSE_STUBS } from "../../data/courses.temp";
import type { Market, Contestant } from "../../engine/market.types";
import { extractTextFromPdf } from "../../market/pdf/extractTextFromPdf";
import { parseContestants } from "../../market/contestants/parseContestants";
import "./CreateMarketForm.css";


export default function CreateMarketForm({
  category,
  onSubmit,
  onCancel,
}: {
  category: string;
  onSubmit: (market: Market) => void;
  onCancel: () => void;
}) {
  /* =========================
     EVENT CONTEXT
  ========================= */
  const [eventName, setEventName] = useState("");
  const [format, setFormat] =
    useState<"SINGLES" | "BEST_BALL_2">("SINGLES");

  /* =========================
     COURSE CONTEXT
  ========================= */
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [teeName, setTeeName] = useState("Blue");
  const [par, setPar] = useState(72);
  const [yardage, setYardage] = useState(6800);
  const [courseLocation, setCourseLocation] = useState("");
  const [courseRating, setCourseRating] = useState(72.0);
  const [slopeRating, setSlopeRating] = useState(113);
  const [availableTees, setAvailableTees] = useState<
    { teeName: string; par: number; courseRating: number; slopeRating: number }[]
  >([]);

  /* =========================
     SCHEDULE
  ========================= */
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  /* =========================
     EXPOSURE
  ========================= */
  const [maxPerContract, setMaxPerContract] = useState(50);

  /* =========================
     CONTESTANTS
  ========================= */
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  async function handlePdfParse() {
    if (!pdfFile) return;

    setParsing(true);
    setParseError(null);

    try {
      const { text } = await extractTextFromPdf(pdfFile);
      const { contestants } = parseContestants(text);
      setContestants(contestants);
    } catch (err) {
      console.error(err);
      setParseError("Failed to parse PDF.");
    }

    setParsing(false);
  }

  /* =========================
     SUBMIT
  ========================= */
  function handleSubmit() {
    if (!eventName || !courseName) return;

    const startDateTime =
      startDate && startTime
        ? new Date(`${startDate}T${startTime}`).toISOString()
        : new Date().toISOString();

    const newMarket: Market = {
      id: `market_${Date.now()}`,
      creatorId: "local_user",
      creatorUsername: "You",

      format,

      courseContext: {
        courseId: selectedCourseId || `manual_${Date.now()}`,
        courseName,
        courseLocation,
        teeName,
        par,
        yardage,
        courseRating,
        slopeRating,
        declaredBy: "creator",
      },


      startTime: startDateTime,

      tileWagerIds: [],

      exposure: {
        maxPerContract,
      },

      contestants,
      contestantUpload: {
        status: contestants.length ? "ready" : "idle",
        uploadedAt: contestants.length
          ? new Date().toISOString()
          : undefined,
        sourceName: pdfFile?.name,
        parsedCount: contestants.length,
      },

      status: "draft",
      createdAt: new Date().toISOString(),
    };

    onSubmit(newMarket);
  }

  return (
    <div className="market-form">

      <h4 className="market-title">Create Market</h4>

      {/* ================= EVENT CONTEXT ================= */}
      <div className="market-section">

        <span className="market-label">Event Context</span>

        <div className="market-group">
          <label className="market-label">Event Name</label>
          <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
        </div>

        <div className="market-group">
          <label className="market-label">Format</label>
          <select
            value={format}
            onChange={(e) =>
              setFormat(e.target.value as "SINGLES" | "BEST_BALL_2")
            }
          >
            <option value="SINGLES">Singles</option>
            <option value="BEST_BALL_2">2-Man Best Ball</option>
          </select>
        </div>

      </div>

      {/* ================= COURSE CONTEXT ================= */}
      <div className="market-section">

        <span className="market-label">Course Context</span>

        <div className="market-group">
          <label className="market-label">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              const course = COURSE_STUBS.find(
                (c) => c.id === e.target.value
              );
              if (!course) return;

              setSelectedCourseId(course.id);
              setCourseName(course.name);
              setCourseLocation(`${course.city}, ${course.state}`);

              const tees = (course as any).tees ?? [];
              setAvailableTees(tees);

              if (tees.length > 0) {
                setTeeName(tees[0].teeName);
                setPar(tees[0].par);
                setCourseRating(tees[0].courseRating);
                setSlopeRating(tees[0].slopeRating);
              }
            }}
          >
            <option value="">Select Course</option>
            {COURSE_STUBS.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.city})
              </option>
            ))}
          </select>
        </div>

        <div className="market-row">

          <div className="market-group">
            <label className="market-label">Tee</label>
            <select
              value={teeName}
              onChange={(e) => {
                const nextTee = e.target.value;
                setTeeName(nextTee);

                const tee = availableTees.find(
                  (t) => t.teeName === nextTee
                );
                if (!tee) return;

                setPar(tee.par);
                setCourseRating(tee.courseRating);
                setSlopeRating(tee.slopeRating);
              }}
            >
              {availableTees.length === 0 ? (
                <option value={teeName}>{teeName}</option>
              ) : (
                availableTees.map((t) => (
                  <option key={t.teeName} value={t.teeName}>
                    {t.teeName}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="market-group">
            <label className="market-label">Par</label>
            <input type="number" value={par} readOnly />
          </div>

          <div className="market-group">
            <label className="market-label">Yardage</label>
            <input
              type="number"
              value={yardage}
              onChange={(e) =>
                setYardage(Number(e.target.value))
              }
            />
          </div>

        </div>

        <div className="market-row">

          <div className="market-group">
            <label className="market-label">Course Rating</label>
            <input
              type="number"
              step="0.1"
              value={courseRating}
              onChange={(e) =>
                setCourseRating(Number(e.target.value))
              }
            />
          </div>

          <div className="market-group">
            <label className="market-label">Slope Rating</label>
            <input
              type="number"
              value={slopeRating}
              onChange={(e) =>
                setSlopeRating(Number(e.target.value))
              }
            />
          </div>

        </div>

      </div>

      {/* ================= SCHEDULE ================= */}
      <div className="market-section">

        <span className="market-label">Schedule</span>

        <div className="market-row">

          <div className="market-group">
            <label className="market-label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
            />
          </div>

          <div className="market-group">
            <label className="market-label">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) =>
                setStartTime(e.target.value)
              }
            />
          </div>

        </div>

      </div>

      {/* ================= EXPOSURE ================= */}
      <div className="market-section">

        <span className="market-label">Exposure</span>

        <div className="market-group">
          <label className="market-label">
            Max Wager Per Contract ($)
          </label>
          <input
            type="number"
            value={maxPerContract}
            onChange={(e) =>
              setMaxPerContract(Number(e.target.value))
            }
          />
        </div>

      </div>

      {/* ================= CONTESTANTS ================= */}
      <div className="market-section">

        <span className="market-label">Contestants (PDF Upload)</span>

        <div className="market-file">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) =>
              setPdfFile(e.target.files?.[0] || null)
            }
          />

          <button
            className="market-primary"
            onClick={handlePdfParse}
            disabled={!pdfFile || parsing}
          >
            {parsing ? "Parsing..." : "Parse PDF"}
          </button>
        </div>

        {parseError && (
          <div className="market-error">
            {parseError}
          </div>
        )}

        {contestants.length > 0 && (
          <div className="market-contestant-list">
            <div className="market-contestant-meta">
              Parsed {contestants.length} contestants
            </div>
            {contestants.map((c) => (
              <div key={c.id} className="market-contestant-item">
                {c.name}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ================= ACTIONS ================= */}
     <div className="market-actions">
  <button
    className="market-secondary"
    onClick={onCancel}
  >
    Cancel
  </button>

  <button
    className="market-primary"
    onClick={handleSubmit}
  >
    Continue
  </button>
</div>

    </div>
  );
}
