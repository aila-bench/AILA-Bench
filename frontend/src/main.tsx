import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Clock3,
  Crosshair,
  Download,
  Gauge,
  MousePointer2,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Square,
  Trash2,
  UserRound,
} from "lucide-react";
import "./styles.css";

type Condition = "human_only" | "ai_assisted" | "ai_assisted_confidence";

type ApiImage = {
  id: number;
  dataset: string;
  split: string;
  external_id: string;
  file_name: string;
  width: number | null;
  height: number | null;
};

type Suggestion = {
  id: number;
  image_id: number;
  model_name: string;
  category: string;
  confidence: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  ai_error_type: string | null;
  disagreement: Record<string, unknown>;
};

type Task = {
  id: number;
  image_id: number;
  status: string;
  annotator_id: string | null;
  review_time_ms: number | null;
  metadata_json: Record<string, unknown>;
};

type TaskBundle = {
  task: Task;
  image: ApiImage;
  suggestions: Suggestion[];
  classes: string[];
  display_condition: "standard" | "reference";
  show_confidence: boolean;
};

type DemoMode = "human" | "reference" | "confidence";

type Label = {
  temp_id: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number | null;
  source_suggestion_id?: number | null;
};

type EventLog = {
  client_event_id: string;
  timestamp_ms: number;
  action_type: string;
  label_temp_id?: string;
  before?: Partial<Label>;
  after?: Partial<Label>;
  details?: Record<string, unknown>;
};

type AnnotationMode = "select" | "draw";

type TaskDraft = {
  paused: boolean;
  elapsedMs: number;
  mode: AnnotationMode;
  activeClass: string;
  selectedId: string | null;
  labels: Label[];
  events: EventLog[];
};

type Stats = {
  images: number;
  tasks_total: number;
  tasks_pending: number;
  tasks_in_progress: number;
  tasks_submitted: number;
  final_labels: number;
  annotation_events: number;
  ai_suggestions: number;
  conditions: Record<string, number>;
};

type Artifact = {
  name: string;
  path: string;
  exists: boolean;
  size_bytes: number | null;
};

type ReportSummary = {
  total_rows: number;
  total_errors: number;
  overall_error_rate: number;
  conditions: Array<Record<string, unknown>>;
  best_low_budget_policy: null | Record<string, unknown>;
};

type Report = {
  summary: ReportSummary | null;
  artifacts: Artifact[];
};

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const DEMO_IMAGE: ApiImage = {
  id: 1,
  dataset: "bdd100k",
  split: "train",
  external_id: "0000f77c-6257be58",
  file_name: "0000f77c-6257be58.jpg",
  width: 1280,
  height: 720,
};

const DEMO_IMAGE_URL = "/demo-assets/0000f77c-6257be58.jpg";

const DEMO_CLASSES = [
  "car",
  "pedestrian",
  "rider",
  "bus",
  "truck",
  "motorcycle",
  "traffic light",
  "traffic sign",
];

const DEMO_SUGGESTIONS: Suggestion[] = [
  {
    id: 1,
    image_id: 1,
    model_name: "yolo11",
    category: "car",
    confidence: 0.913,
    x: 59.3,
    y: 251.8,
    width: 304.5,
    height: 236.1,
    ai_error_type: null,
    disagreement: {},
  },
  {
    id: 2,
    image_id: 1,
    model_name: "yolo11",
    category: "car",
    confidence: 0.788,
    x: 504.7,
    y: 224.8,
    width: 405.7,
    height: 215.6,
    ai_error_type: null,
    disagreement: {},
  },
  {
    id: 3,
    image_id: 1,
    model_name: "yolo11",
    category: "traffic light",
    confidence: 0.772,
    x: 1125.4,
    y: 137.8,
    width: 35.9,
    height: 72.3,
    ai_error_type: null,
    disagreement: {},
  },
  {
    id: 4,
    image_id: 1,
    model_name: "yolo11",
    category: "traffic light",
    confidence: 0.645,
    x: 1164.3,
    y: 137.9,
    width: 31.9,
    height: 70.9,
    ai_error_type: null,
    disagreement: {},
  },
  {
    id: 5,
    image_id: 1,
    model_name: "yolo11",
    category: "car",
    confidence: 0.482,
    x: 4.9,
    y: 560.7,
    width: 1268.6,
    height: 151.1,
    ai_error_type: null,
    disagreement: {},
  },
];

const CLASS_LABELS: Record<string, string> = {
  car: "Car",
  pedestrian: "Pedestrian",
  rider: "Rider",
  bus: "Bus",
  truck: "Truck",
  motorcycle: "Motorcycle",
  "traffic light": "Traffic light",
  "traffic sign": "Traffic sign",
};

const CONDITION_LABELS: Record<string, string> = {
  human_only: "Human only",
  ai_assisted: "Reference boxes",
  ai_assisted_confidence: "References + confidence",
};

const ARTIFACT_LABELS: Record<string, string> = {
  features: "Annotation features",
  scored_features: "Risk scores",
  review_metrics: "Review policy metrics",
  report_markdown: "Experiment report",
  report_summary: "Report summary",
  yolo_predictions: "YOLO pre-labels",
};

const POLICY_LABELS: Record<string, string> = {
  Random: "Random review",
  "Low-confidence": "Low-confidence first",
  "High-confidence": "High-confidence first",
  "High-loss": "High-loss first",
  "Ensemble disagreement": "Ensemble disagreement",
  "Confident learning": "Confident learning",
  SCLNScore: "SCLNScore",
};

const COORD_LABELS: Record<"x" | "y" | "width" | "height", string> = {
  x: "Top-left X",
  y: "Top-left Y",
  width: "Width",
  height: "Height",
};

function classLabel(value: string) {
  return CLASS_LABELS[value] || value;
}

function conditionLabel(value: string) {
  return CONDITION_LABELS[value] || value;
}

function artifactLabel(value: string) {
  return ARTIFACT_LABELS[value] || value.replace(/_/g, " ");
}

function policyLabel(value: unknown) {
  const text = String(value ?? "");
  return POLICY_LABELS[text] || text;
}

function isProblemMessage(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("error") || value.includes("failed") || value.includes("unavailable");
}

function createId(prefix: string) {
  const webCrypto = globalThis.crypto as Crypto | undefined;
  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowMs(start: number) {
  return Math.round(performance.now() - start);
}

function clampBox(label: Label, width: number, height: number): Label {
  const x = Math.max(0, Math.min(label.x, width));
  const y = Math.max(0, Math.min(label.y, height));
  const boxWidth = Math.max(1, Math.min(label.width, width - x));
  const boxHeight = Math.max(1, Math.min(label.height, height - y));
  return { ...label, x, y, width: boxWidth, height: boxHeight };
}

function suggestionToLabel(suggestion: Suggestion): Label {
  return {
    temp_id: `ai-${suggestion.id}`,
    category: suggestion.category,
    x: suggestion.x,
    y: suggestion.y,
    width: suggestion.width,
    height: suggestion.height,
    confidence: suggestion.confidence,
    source_suggestion_id: suggestion.id,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isLabel(value: unknown): value is Label {
  if (!isRecord(value)) return false;
  return (
    typeof value.temp_id === "string" &&
    typeof value.category === "string" &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height) &&
    (value.confidence === undefined || value.confidence === null || isFiniteNumber(value.confidence)) &&
    (value.source_suggestion_id === undefined ||
      value.source_suggestion_id === null ||
      isFiniteNumber(value.source_suggestion_id))
  );
}

function isEventLog(value: unknown): value is EventLog {
  if (!isRecord(value)) return false;
  return (
    typeof value.client_event_id === "string" &&
    isFiniteNumber(value.timestamp_ms) &&
    typeof value.action_type === "string" &&
    (value.label_temp_id === undefined || typeof value.label_temp_id === "string")
  );
}

function readDraft(task: Task, fallbackLabels: Label[], classes: string[]): TaskDraft | null {
  const rawDraft = task.metadata_json?.draft;
  if (!isRecord(rawDraft)) return null;
  const labels = Array.isArray(rawDraft.labels) ? rawDraft.labels.filter(isLabel) : fallbackLabels;
  const events = Array.isArray(rawDraft.events) ? rawDraft.events.filter(isEventLog) : [];
  const elapsedMs = isFiniteNumber(rawDraft.elapsedMs) ? Math.max(0, Math.round(rawDraft.elapsedMs)) : 0;
  const selectedId =
    typeof rawDraft.selectedId === "string" && labels.some((label) => label.temp_id === rawDraft.selectedId)
      ? rawDraft.selectedId
      : null;
  const activeClass =
    typeof rawDraft.activeClass === "string" && classes.includes(rawDraft.activeClass)
      ? rawDraft.activeClass
      : classes[0] || "car";
  const mode: AnnotationMode = rawDraft.mode === "select" || rawDraft.mode === "draw" ? rawDraft.mode : "draw";
  return {
    paused: rawDraft.paused === true,
    elapsedMs,
    mode,
    activeClass,
    selectedId,
    labels,
    events,
  };
}

function taskTypeLabel(bundle: TaskBundle) {
  if (bundle.display_condition === "standard") return "Annotate from scratch";
  if (bundle.show_confidence) return "Review references + confidence";
  return "Review reference boxes";
}

function taskTypeHint(bundle: TaskBundle) {
  if (bundle.display_condition === "standard") return "Start from a blank image and label all specified classes.";
  if (bundle.show_confidence) return "Review existing reference boxes with confidence scores; edit, delete, or add as needed.";
  return "Review existing reference boxes; edit, delete, or add as needed.";
}

function demoModeLabel(mode: DemoMode) {
  if (mode === "human") return "Annotate from scratch";
  if (mode === "reference") return "Review reference boxes";
  return "References + confidence";
}

function demoModeHint(mode: DemoMode) {
  if (mode === "human") return "Raw image only—participants draw all specified classes from scratch.";
  if (mode === "reference") return "Shows AI boxes and classes; participants review, edit, delete, or add.";
  return "Shows AI boxes, classes, and confidence; participants review and confirm.";
}

function demoLabels(mode: DemoMode) {
  if (mode === "human") return [];
  return DEMO_SUGGESTIONS.map((suggestion) => ({
    ...suggestionToLabel(suggestion),
    confidence: mode === "confidence" ? suggestion.confidence : null,
  }));
}

function demoBundle(mode: DemoMode): TaskBundle {
  return {
    task: {
      id: mode === "human" ? -1 : mode === "reference" ? -2 : -3,
      image_id: DEMO_IMAGE.id,
      status: "demo",
      annotator_id: "demo",
      review_time_ms: null,
      metadata_json: {},
    },
    image: DEMO_IMAGE,
    suggestions: mode === "human" ? [] : DEMO_SUGGESTIONS,
    classes: DEMO_CLASSES,
    display_condition: mode === "human" ? "standard" : "reference",
    show_confidence: mode === "confidence",
  };
}

function currentRoute() {
  const path = window.location.pathname;
  if (path === "/demo/examples" || path === "/demo/practice") return path;
  return "/";
}

function Root() {
  const route = currentRoute();
  if (route === "/demo/examples") return <DemoExamples />;
  if (route === "/demo/practice") return <DemoPractice />;
  return <App />;
}

function App() {
  const [view, setView] = useState<"annotator" | "researcher">("annotator");
  const [annotatorId, setAnnotatorId] = useState(() => localStorage.getItem("annotatorId") || "pilot-a");
  const [bundle, setBundle] = useState<TaskBundle | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeClass, setActiveClass] = useState("car");
  const [mode, setMode] = useState<AnnotationMode>("draw");
  const [message, setMessage] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const startRef = useRef(performance.now());
  const draftSaveTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("annotatorId", annotatorId);
  }, [annotatorId]);

  useEffect(() => {
    refreshStats();
    refreshReport();
    const statsTimer = window.setInterval(refreshStats, 5000);
    const reportTimer = window.setInterval(refreshReport, 30000);
    return () => {
      window.clearInterval(statsTimer);
      window.clearInterval(reportTimer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!bundle || paused) return;
      setElapsedMs(nowMs(startRef.current));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [bundle, paused]);

  useEffect(() => {
    return () => {
      if (draftSaveTimer.current != null) {
        window.clearTimeout(draftSaveTimer.current);
      }
    };
  }, []);

  const selected = labels.find((label) => label.temp_id === selectedId) || null;
  const imageUrl = bundle ? `${API_BASE}/images/${bundle.image.id}/file` : "";
  const showConfidence = Boolean(bundle?.show_confidence);
  const totalTasks = stats?.tasks_total ?? 0;
  const submittedTasks = stats?.tasks_submitted ?? 0;
  const progressPercent = totalTasks > 0 ? Math.round((submittedTasks / totalTasks) * 100) : 0;

  useEffect(() => {
    if (!bundle) return;
    if (draftSaveTimer.current != null) {
      window.clearTimeout(draftSaveTimer.current);
    }
    draftSaveTimer.current = window.setTimeout(() => {
      void saveDraft({
        paused,
        elapsedMs,
        mode,
        activeClass,
        selectedId,
        labels,
        events,
      });
    }, 600);
  }, [bundle, paused, elapsedMs, mode, activeClass, selectedId, labels, events]);

  function log(action_type: string, details: Partial<EventLog> = {}) {
    setEvents((current) => [
      ...current,
      {
        client_event_id: createId("evt"),
        timestamp_ms: nowMs(startRef.current),
        action_type,
        details: {},
        ...details,
      },
    ]);
  }

  function createEvent(action_type: string, details: Partial<EventLog> = {}): EventLog {
    return {
      client_event_id: createId("evt"),
      timestamp_ms: nowMs(startRef.current),
      action_type,
      details: {},
      ...details,
    };
  }

  async function refreshStats() {
    try {
      const response = await fetch(`${API_BASE}/stats/summary`);
      if (response.ok) setStats(await response.json());
    } catch {
      setStats(null);
    }
  }

  async function refreshReport() {
    try {
      const response = await fetch(`${API_BASE}/reports/latest`);
      if (response.ok) setReport(await response.json());
    } catch {
      setReport(null);
    }
  }

  async function saveDraft(draft: Record<string, unknown>) {
    if (!bundle) return;
    try {
      await fetch(`${API_BASE}/tasks/${bundle.task.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annotator_id: annotatorId,
          draft,
        }),
      });
    } catch {
      // Draft save is best effort.
    }
  }

  async function claimTask(condition?: Condition) {
    setBusy(true);
    setMessage("Loading next image...");
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/tasks/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotator_id: annotatorId, condition }),
      });
    } catch {
      setMessage("Cannot reach backend. Confirm port 8001 is open.");
      setBusy(false);
      return;
    }
    if (!response.ok) {
      setMessage("No tasks available. Contact the administrator.");
      setBusy(false);
      return;
    }
    const data: TaskBundle = await response.json();
    const fallbackLabels = data.suggestions.map(suggestionToLabel);
    const draft = readDraft(data.task, fallbackLabels, data.classes);
    const restoredLabels = draft?.labels ?? fallbackLabels;
    const restoredEvents = draft?.events ?? [];
    const restoredElapsedMs = draft?.elapsedMs ?? 0;
    startRef.current = performance.now() - restoredElapsedMs;
    const openEvent = createEvent("task_open", {
      details: {
        task_id: data.task.id,
        mode: data.display_condition,
        task_type: taskTypeLabel(data),
        restored: Boolean(draft),
      },
    });
    setBundle(data);
    setLabels(restoredLabels);
    setEvents([...restoredEvents, openEvent]);
    setSelectedId(draft?.selectedId ?? null);
    setActiveClass(draft?.activeClass ?? data.classes[0] ?? "car");
    setMode(draft?.mode ?? "draw");
    setPaused(draft?.paused ?? false);
    setElapsedMs(restoredElapsedMs);
    setMessage(draft ? "Restored your last incomplete image." : `${taskTypeLabel(data)} task loaded.`);
    setBusy(false);
    refreshStats();
  }

  async function submitTask() {
    if (!bundle) return;
    setBusy(true);
    log("confirm", { details: { label_count: labels.length } });
    const outgoingEvents = [
      ...events,
      {
        client_event_id: createId("evt"),
        timestamp_ms: nowMs(startRef.current),
        action_type: "confirm",
        details: { label_count: labels.length },
      },
    ];
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/tasks/${bundle.task.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annotator_id: annotatorId,
          review_time_ms: nowMs(startRef.current),
          started_at_client_ms: 0,
          labels: labels.map(({ temp_id, ...label }) => ({ temp_id, ...label })),
          events: outgoingEvents,
        }),
      });
    } catch {
      setMessage("Cannot reach backend. Confirm port 8001 is open.");
      setBusy(false);
      return;
    }
    if (!response.ok) {
      setMessage("Submit failed. Retry or contact the administrator.");
      setBusy(false);
      return;
    }
    await response.json();
    await saveDraft({
      paused: false,
      elapsedMs: 0,
      mode: "draw",
      activeClass: "car",
      selectedId: null,
      labels: [],
      events: [],
    });
    setBundle(null);
    setLabels([]);
    setEvents([]);
    setSelectedId(null);
    setElapsedMs(0);
    setPaused(false);
    await claimTask();
  }

  function togglePause() {
    setPaused((current) => {
      const next = !current;
      const nextElapsedMs = current ? elapsedMs : nowMs(startRef.current);
      if (current) {
        startRef.current = performance.now() - elapsedMs;
      } else {
        setElapsedMs(nextElapsedMs);
      }
      setMessage(next ? "Timer paused. You can resume this task." : "Timer resumed.");
      void saveDraft({
        paused: next,
        elapsedMs: nextElapsedMs,
        mode,
        activeClass,
        selectedId,
        labels,
        events,
      });
      return next;
    });
  }

  function addLabel(box: Omit<Label, "temp_id" | "category">) {
    if (!bundle) return;
    const imageWidth = bundle.image.width || 1;
    const imageHeight = bundle.image.height || 1;
    const label = clampBox(
      {
        temp_id: createId("lbl"),
        category: activeClass,
        ...box,
      },
      imageWidth,
      imageHeight,
    );
    setLabels((current) => [...current, label]);
    setSelectedId(label.temp_id);
    log("box_create", { label_temp_id: label.temp_id, after: label });
  }

  function updateLabel(next: Label, actionType = "box_edit", before?: Label) {
    if (!bundle) return;
    const imageWidth = bundle.image.width || 1;
    const imageHeight = bundle.image.height || 1;
    const clamped = clampBox(next, imageWidth, imageHeight);
    setLabels((current) => current.map((label) => (label.temp_id === next.temp_id ? clamped : label)));
    log(actionType, { label_temp_id: next.temp_id, before, after: clamped });
  }

  function deleteSelected() {
    if (!selected) return;
    setLabels((current) => current.filter((label) => label.temp_id !== selected.temp_id));
    setSelectedId(null);
    log("box_delete", { label_temp_id: selected.temp_id, before: selected });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">Autonomous Driving Scene Annotation</div>
          <div className="subtitle">Draw bounding boxes around visible targets and choose the best class.</div>
        </div>
        <div className="topActions">
          <button className={view === "annotator" ? "activeView" : ""} onClick={() => setView("annotator")}>
            <UserRound size={16} /> Annotate
          </button>
          <button className={view === "researcher" ? "activeView" : ""} onClick={() => setView("researcher")}>
            <BarChart3 size={16} /> Researcher
          </button>
        </div>
      </header>

      <aside className="sidebar">
        {view === "annotator" ? (
          <>
            <section className="panel">
              <div className="panelTitle">Annotation progress</div>
              <div className="progressBlock">
                <div className="progressTrack" aria-hidden="true">
                  <div className="progressFill" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="progressMeta">
                  <span>{stats ? `${submittedTasks} / ${totalTasks}` : "Loading..."}</span>
                  <strong>{stats ? `${progressPercent}%` : "--"}</strong>
                </div>
              </div>
              <div className="summaryList">
                <Metric icon={<Clock3 size={15} />} label="Pending" value={stats?.tasks_pending ?? 0} compact />
                <Metric icon={<Activity size={15} />} label="In progress" value={stats?.tasks_in_progress ?? 0} compact />
                <Metric icon={<CheckCircle2 size={15} />} label="Completed" value={submittedTasks} compact />
                <Metric icon={<Activity size={15} />} label="Total tasks" value={totalTasks} compact />
              </div>
            </section>
            <section className="panel">
              <div className="panelTitle">Annotation session</div>
              <label className="field">
                <span>Participant ID</span>
                <input value={annotatorId} onChange={(event) => setAnnotatorId(event.target.value)} />
              </label>
              <div className="taskTypeLegend" aria-label="Task type legend">
                <span>Tasks are assigned automatically—no manual selection.</span>
                <div className="taskTypeList">
                  <span>Annotate from scratch</span>
                  <span>Review reference boxes</span>
                  <span>References + confidence</span>
                </div>
              </div>
              <button className="primary" disabled={busy || Boolean(bundle)} onClick={() => claimTask()}>
                <RefreshCcw size={16} /> Resume / Start next image
              </button>
            </section>
          </>
        ) : (
          <section className="panel">
            <div className="panelTitle">Study progress</div>
            <div className="summaryList">
              <Metric icon={<Activity size={15} />} label="Images" value={stats?.images ?? 0} compact />
              <Metric icon={<Clock3 size={15} />} label="Pending" value={stats?.tasks_pending ?? 0} compact />
              <Metric icon={<Activity size={15} />} label="In progress" value={stats?.tasks_in_progress ?? 0} compact />
              <Metric icon={<CheckCircle2 size={15} />} label="Submitted" value={stats?.tasks_submitted ?? 0} compact />
              <Metric icon={<Sparkles size={15} />} label="Reference boxes" value={stats?.ai_suggestions ?? 0} compact />
            </div>
          </section>
        )}

        {view === "annotator" && bundle && (
          <section className="panel">
            <div className="panelTitle">Current image</div>
            <div className="taskMeta">
              <div className="taskTypeCard">
                <span>Task type</span>
                <strong>{taskTypeLabel(bundle)}</strong>
                <p>{taskTypeHint(bundle)}</p>
              </div>
              <div>
                <span>Image ID</span>
                <strong>{bundle.image.external_id}</strong>
              </div>
              <div className="metaGrid">
                <Metric icon={<Crosshair size={15} />} label="Boxes" value={labels.length} compact />
                <Metric icon={<CircleDot size={15} />} label="Actions" value={events.length} compact />
                <Metric icon={<Clock3 size={15} />} label={paused ? "Paused" : "Elapsed"} value={`${Math.round(elapsedMs / 1000)}s`} compact />
              </div>
              <button type="button" className={paused ? "secondary pauseActive" : "secondary"} onClick={togglePause}>
                {paused ? "Resume timer" : "Pause timer"}
              </button>
            </div>
          </section>
        )}

        {view === "annotator" && bundle && (
          <section className="panel">
            <div className="panelTitle">Annotation tools</div>
            <div className="segmented">
              <button type="button" className={mode === "draw" ? "active" : ""} onClick={() => setMode("draw")} title="Draw bounding box">
                <Square size={16} /> Draw box
              </button>
              <button type="button" className={mode === "select" ? "active" : ""} onClick={() => setMode("select")} title="Select bounding box">
                <MousePointer2 size={16} /> Select
              </button>
            </div>
            <div className="field">
              <span>New object class</span>
              <ClassPalette classes={bundle.classes} value={activeClass} onChange={setActiveClass} />
            </div>
            <button className="primary" disabled={busy || paused} onClick={submitTask}>
              <Save size={16} /> Submit and continue
            </button>
          </section>
        )}

        {message && (
          <div className="message">
            {isProblemMessage(message) ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{message}</span>
          </div>
        )}
      </aside>

      <main className="workspace">
        {view === "annotator" && bundle ? (
          <AnnotatorCanvas
            imageUrl={imageUrl}
            imageWidth={bundle.image.width || 960}
            imageHeight={bundle.image.height || 540}
            labels={labels}
            selectedId={selectedId}
            mode={mode}
            showConfidence={showConfidence}
            onSelect={setSelectedId}
            onAdd={addLabel}
            onUpdate={updateLabel}
          />
        ) : view === "annotator" ? (
          <div className="emptyState">
            <Plus size={28} />
            <div>
              <strong>Ready for the next image</strong>
              <span>Label all visible targets from the class list on the right.</span>
            </div>
          </div>
        ) : (
          <ResearchWorkspace report={report} stats={stats} />
        )}
      </main>

      <aside className="rightbar">
        {view === "annotator" && bundle ? (
          <>
            <section className="panel">
              <div className="panelHeader">
                <div className="panelTitle">Object list</div>
                <button
                  disabled={labels.length === 0}
                  onClick={() => {
                    labels.forEach((label) =>
                      log("confirm", {
                        label_temp_id: label.temp_id,
                        after: label,
                        details: { bulk: true },
                      }),
                    );
                    setMessage("Marked all current objects as reviewed.");
                  }}
                >
                  <CheckCircle2 size={15} /> Mark reviewed
                </button>
              </div>
              <div className="labelList">
                {labels.length === 0 && <div className="muted">No bounding boxes yet.</div>}
                {labels.map((label, index) => (
                  <button
                    key={label.temp_id}
                    className={`labelRow ${selectedId === label.temp_id ? "selectedRow" : ""}`}
                    onClick={() => setSelectedId(label.temp_id)}
                  >
                    <span className="labelIndex">{index + 1}</span>
                    <span>{classLabel(label.category)}</span>
                    {showConfidence && label.confidence != null && (
                      <strong>{label.confidence.toFixed(2)}</strong>
                    )}
                  </button>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="panelTitle">Box inspector</div>
              {selected ? (
                <Inspector
                  classes={bundle.classes}
                  label={selected}
                  showConfidence={showConfidence}
                  onChange={(next, actionType) => updateLabel(next, actionType, selected)}
                  onDelete={deleteSelected}
                />
              ) : (
                <div className="muted">Select a box to edit its class or coordinates.</div>
              )}
            </section>
          </>
        ) : (
          <>
            {view === "annotator" ? <ClassGuide /> : <ReportPanel report={report} />}
          </>
        )}
      </aside>
    </div>
  );
}

function ReportPanel({ report }: { report: Report | null }) {
  const summary = report?.summary;
  return (
    <section className="panel">
      <div className="panelTitle">Latest report</div>
      {summary ? (
        <>
          <div className="summaryList">
            <Metric icon={<Activity size={15} />} label="Rows" value={summary.total_rows} compact />
            <Metric icon={<AlertCircle size={15} />} label="Errors" value={summary.total_errors} compact />
            <Metric
              icon={<Gauge size={15} />}
              label="Error rate"
              value={`${(summary.overall_error_rate * 100).toFixed(1)}%`}
              compact
            />
          </div>
          {summary.best_low_budget_policy && (
            <div className="reportCallout">
              <span>Best low-budget policy</span>
              <strong>{policyLabel(summary.best_low_budget_policy.policy)}</strong>
            </div>
          )}
        </>
      ) : (
        <div className="muted">No report generated yet.</div>
      )}
      <div className="artifactList">
        {(report?.artifacts || []).map((artifact) => (
          <a
            key={artifact.name}
            className={`artifactRow ${artifact.exists ? "" : "disabledLink"}`}
            href={`${API_BASE}/reports/artifacts/${artifact.name}`}
            onClick={(event) => {
              if (!artifact.exists) event.preventDefault();
            }}
          >
            <Download size={14} />
            <span>{artifactLabel(artifact.name)}</span>
            <strong>{artifact.exists && artifact.size_bytes ? `${Math.ceil(artifact.size_bytes / 1024)} KB` : "Missing"}</strong>
          </a>
        ))}
      </div>
    </section>
  );
}

function ClassGuide() {
  const classes = [
    "car",
    "pedestrian",
    "rider",
    "bus",
    "truck",
    "motorcycle",
    "traffic light",
    "traffic sign",
  ];
  return (
    <section className="panel">
      <div className="panelTitle">Target classes</div>
      <div className="muted">Workflow: start next image, draw or review boxes, adjust class and position, then submit.</div>
      <div className="classGuide">
        {classes.map((item) => (
          <span key={item}>{classLabel(item)}</span>
        ))}
      </div>
    </section>
  );
}

function DemoShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="demoPage">
      <header className="demoTopbar">
        <div>
          <div className="brand">{title}</div>
          <div className="subtitle">{subtitle}</div>
        </div>
        <div className="topActions">
          <a className="navButton" href="/">
            <ArrowLeft size={16} /> Back to annotation
          </a>
          <a className="navButton" href="/demo/examples">
            Three conditions
          </a>
          <a className="navButton" href="/demo/practice">
            Practice UI
          </a>
        </div>
      </header>
      {children}
    </div>
  );
}

function DemoExamples() {
  const modes: DemoMode[] = ["human", "reference", "confidence"];
  return (
    <DemoShell title="Task type examples" subtitle="Training and demo only—no real tasks, submissions, or database writes.">
      <main className="demoExamples">
        {modes.map((mode) => (
          <section className="demoCard" key={mode}>
            <div className="demoCardHeader">
              <div>
                <h2>{demoModeLabel(mode)}</h2>
                <p>{demoModeHint(mode)}</p>
              </div>
              <strong>{mode === "human" ? "No reference boxes" : `${DEMO_SUGGESTIONS.length} reference boxes`}</strong>
            </div>
            <DemoPreview mode={mode} />
          </section>
        ))}
      </main>
    </DemoShell>
  );
}

function DemoPreview({ mode }: { mode: DemoMode }) {
  const labels = demoLabels(mode);
  return (
    <div className="demoPreview">
      <StaticAnnotationPreview
        imageUrl={DEMO_IMAGE_URL}
        imageWidth={DEMO_IMAGE.width || 1280}
        imageHeight={DEMO_IMAGE.height || 720}
        labels={labels}
        showConfidence={mode === "confidence"}
      />
      <div className="demoInfo">
        <span>Image ID</span>
        <strong>{DEMO_IMAGE.external_id}</strong>
      </div>
    </div>
  );
}

function DemoPractice() {
  const [mode, setMode] = useState<DemoMode>("human");
  const bundle = demoBundle(mode);
  const labels = demoLabels(mode);
  return (
    <DemoShell title="Practice interface" subtitle="Switch among three task modes to show annotators what the live UI looks like.">
      <div className="demoPractice">
        <aside className="demoSide">
          <section className="panel">
            <div className="panelTitle">Demo mode</div>
            <div className="demoModeSwitch">
              {(["human", "reference", "confidence"] as DemoMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={mode === item ? "active" : ""}
                  onClick={() => setMode(item)}
                >
                  {demoModeLabel(item)}
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panelTitle">Current image</div>
            <div className="taskMeta">
              <div className="taskTypeCard">
                <span>Task type</span>
                <strong>{taskTypeLabel(bundle)}</strong>
                <p>{taskTypeHint(bundle)}</p>
              </div>
              <div className="metaGrid">
                <Metric icon={<Crosshair size={15} />} label="Boxes" value={labels.length} compact />
                <Metric icon={<CircleDot size={15} />} label="Actions" value="Demo" compact />
                <Metric icon={<Clock3 size={15} />} label="Elapsed" value="N/A" compact />
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panelTitle">Target classes</div>
            <ClassPalette classes={DEMO_CLASSES} value="car" onChange={() => undefined} />
          </section>
        </aside>
        <main className="demoCanvasArea">
          <StaticAnnotationPreview
            imageUrl={DEMO_IMAGE_URL}
            imageWidth={DEMO_IMAGE.width || 1280}
            imageHeight={DEMO_IMAGE.height || 720}
            labels={labels}
            showConfidence={mode === "confidence"}
          />
        </main>
        <aside className="demoSide">
          <section className="panel">
            <div className="panelTitle">Object list</div>
            <div className="labelList">
              {labels.length === 0 && <div className="muted">In from-scratch mode, no boxes are preloaded.</div>}
              {labels.map((label, index) => (
                <div className="demoLabelRow" key={label.temp_id}>
                  <span className="labelIndex">{index + 1}</span>
                  <span>{classLabel(label.category)}</span>
                  {mode === "confidence" && label.confidence != null && <strong>{label.confidence.toFixed(2)}</strong>}
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panelTitle">Demo notes</div>
            <div className="muted">{demoModeHint(mode)}</div>
          </section>
        </aside>
      </div>
    </DemoShell>
  );
}

function StaticAnnotationPreview({
  imageUrl,
  imageWidth,
  imageHeight,
  labels,
  showConfidence,
}: {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  labels: Label[];
  showConfidence: boolean;
}) {
  return (
    <div className="staticFrame">
      <div className="staticStage" style={{ aspectRatio: `${imageWidth} / ${imageHeight}` }}>
        <img src={imageUrl} alt="" />
        {labels.map((label) => (
          <div
            key={label.temp_id}
            className="staticBox"
            style={{
              left: `${(label.x / imageWidth) * 100}%`,
              top: `${(label.y / imageHeight) * 100}%`,
              width: `${(label.width / imageWidth) * 100}%`,
              height: `${(label.height / imageHeight) * 100}%`,
            }}
          >
            <span>
              {classLabel(label.category)}
              {showConfidence && label.confidence != null ? ` ${label.confidence.toFixed(2)}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchWorkspace({ report, stats }: { report: Report | null; stats: Stats | null }) {
  const summary = report?.summary;
  return (
    <div className="researchWorkspace">
      <section className="researchHero">
        <div>
          <h1>Study monitor</h1>
          <p>Track task progress, export artifacts, and view summaries. Do not show this page to participants.</p>
        </div>
        <div className="researchMetrics">
          <Metric icon={<Activity size={16} />} label="Images" value={stats?.images ?? 0} />
          <Metric icon={<CheckCircle2 size={16} />} label="Submitted" value={stats?.tasks_submitted ?? 0} />
          <Metric icon={<Crosshair size={16} />} label="Final labels" value={stats?.final_labels ?? 0} />
          <Metric icon={<Sparkles size={16} />} label="Reference boxes" value={stats?.ai_suggestions ?? 0} />
        </div>
      </section>
      {summary && (
        <section className="researchTable">
          <div className="panelTitle">Condition summary</div>
          <table>
            <thead>
              <tr>
                <th>Condition</th>
                <th>Labels</th>
                <th>Errors</th>
                <th>FDER</th>
              </tr>
            </thead>
            <tbody>
              {summary.conditions.map((row) => (
                <tr key={String(row.condition)}>
                  <td>{conditionLabel(String(row.condition))}</td>
                  <td>{String(row.labels)}</td>
                  <td>{String(row.errors)}</td>
                  <td>{Number(row.fder || 0).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "metric compact" : "metric"}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ClassPalette({
  classes,
  value,
  onChange,
}: {
  classes: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="classPalette" role="group" aria-label="Target class selection">
      {classes.map((item) => (
        <button
          key={item}
          type="button"
          className={value === item ? "classChip active" : "classChip"}
          onClick={() => onChange(item)}
          title={classLabel(item)}
        >
          {classLabel(item)}
        </button>
      ))}
    </div>
  );
}

function Inspector({
  classes,
  label,
  showConfidence,
  onChange,
  onDelete,
}: {
  classes: string[];
  label: Label;
  showConfidence: boolean;
  onChange: (label: Label, actionType?: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="inspector">
      <div className="field">
        <span>Current class</span>
        <ClassPalette
          classes={classes}
          value={label.category}
          onChange={(value) => onChange({ ...label, category: value }, "class_change")}
        />
      </div>
      {showConfidence && label.confidence != null && (
        <div className="confidence">
          <span>Confidence</span>
          <strong>{label.confidence.toFixed(3)}</strong>
        </div>
      )}
      <div className="coordGrid">
        {(["x", "y", "width", "height"] as const).map((key) => (
          <label key={key}>
            <span>{COORD_LABELS[key]}</span>
            <input
              type="number"
              value={Math.round(label[key])}
              onChange={(event) => onChange({ ...label, [key]: Number(event.target.value) })}
            />
          </label>
        ))}
      </div>
      <button className="danger" onClick={onDelete}>
        <Trash2 size={16} /> Delete box
      </button>
    </div>
  );
}

function AnnotatorCanvas({
  imageUrl,
  imageWidth,
  imageHeight,
  labels,
  selectedId,
  mode,
  showConfidence,
  onSelect,
  onAdd,
  onUpdate,
}: {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  labels: Label[];
  selectedId: string | null;
  mode: "select" | "draw";
  showConfidence: boolean;
  onSelect: (id: string | null) => void;
  onAdd: (box: Omit<Label, "temp_id" | "category">) => void;
  onUpdate: (label: Label, actionType?: string, before?: Label) => void;
}) {
  const [draft, setDraft] = useState<null | { x: number; y: number; width: number; height: number }>(null);
  const [drag, setDrag] = useState<null | { id: string; startX: number; startY: number; before: Label }>(null);
  const [frameSize, setFrameSize] = useState({ width: 1, height: 1 });
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setFrameSize({ width: rect.width, height: rect.height });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const scale = useMemo(() => {
    return Math.max(0.05, Math.min(frameSize.width / imageWidth, frameSize.height / imageHeight));
  }, [frameSize, imageWidth, imageHeight]);

  function point(event: React.PointerEvent) {
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(imageWidth, (event.clientX - rect.left) / scale)),
      y: Math.max(0, Math.min(imageHeight, (event.clientY - rect.top) / scale)),
    };
  }

  function onPointerDown(event: React.PointerEvent) {
    const target = event.target as HTMLElement;
    const labelId = target.dataset.labelId;
    if (labelId) {
      onSelect(labelId);
      const label = labels.find((item) => item.temp_id === labelId);
      if (label) setDrag({ id: labelId, startX: point(event).x, startY: point(event).y, before: label });
      return;
    }
    if (mode === "draw") {
      const p = point(event);
      setDraft({ x: p.x, y: p.y, width: 1, height: 1 });
      onSelect(null);
    } else {
      onSelect(null);
    }
  }

  function onPointerMove(event: React.PointerEvent) {
    const p = point(event);
    if (draft) {
      setDraft({
        x: Math.min(draft.x, p.x),
        y: Math.min(draft.y, p.y),
        width: Math.abs(p.x - draft.x),
        height: Math.abs(p.y - draft.y),
      });
    }
    if (drag) {
      const label = labels.find((item) => item.temp_id === drag.id);
      if (!label) return;
      onUpdate(
        {
          ...label,
          x: drag.before.x + (p.x - drag.startX),
          y: drag.before.y + (p.y - drag.startY),
        },
        "box_edit",
        drag.before,
      );
    }
  }

  function onPointerUp() {
    if (draft && draft.width >= 4 && draft.height >= 4) {
      onAdd({ ...draft, confidence: null, source_suggestion_id: null });
    }
    setDraft(null);
    setDrag(null);
  }

  return (
    <div className="canvasFrame" ref={frameRef}>
      <div
        className="imageStage"
        style={{ width: imageWidth * scale, height: imageHeight * scale }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <img src={imageUrl} alt="" draggable={false} />
        {labels.map((label) => (
          <div
            key={label.temp_id}
            data-label-id={label.temp_id}
            className={`box ${selectedId === label.temp_id ? "selected" : ""}`}
            style={{
              left: label.x * scale,
              top: label.y * scale,
              width: label.width * scale,
              height: label.height * scale,
            }}
          >
            <span data-label-id={label.temp_id}>
              {classLabel(label.category)}
              {showConfidence && label.confidence != null ? ` ${label.confidence.toFixed(2)}` : ""}
            </span>
          </div>
        ))}
        {draft && (
          <div
            className="box draft"
            style={{
              left: draft.x * scale,
              top: draft.y * scale,
              width: draft.width * scale,
              height: draft.height * scale,
            }}
          />
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
