"use client";

import AuthGuard from "@/components/AuthGuard";
import OnboardingModal from "@/components/OnboardingModal";
import { supabase } from "@/utils/supabaseClient";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { isWithinInterval } from "date-fns/isWithinInterval";
import { parseISO } from "date-fns/parseISO";
import { useEffect, useState } from "react";

interface Goal {
  id: string;
  title: string;
  description: string;
  repeat_type: string;
  repeat_count: number | null;
  repeat_days: number[] | null;
  any_x_days: boolean | null;
  checkins_per_day: number;
  start_date: string;
  end_date: string | null;
  reset_time: string;
}

function formatDue(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

const REPEAT_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "x_per_week", label: "X times per week" },
  { value: "custom_days", label: "Custom days" },
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper: format date as 'Mon, Jan 5'
function formatDay(dateStr: string) {
  const d = parseISO(dateStr);
  return format(d, "EEE, MMM d");
}

// Helper: format time as 12-hour am/pm
function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return format(date, "h:mm a");
}

// Helper: find next active day for a goal
function getNextActiveDay(goal: Goal) {
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (goal.end_date && d > parseISO(goal.end_date)) break;
    if (goal.start_date && d < parseISO(goal.start_date)) continue;
    if (goal.repeat_type === "daily") return d;
    if (goal.repeat_type === "weekly") {
      const start = parseISO(goal.start_date);
      if (d.getDay() === start.getDay()) return d;
    }
    if (goal.repeat_type === "custom_days" && goal.repeat_days) {
      if (goal.repeat_days.includes(d.getDay())) return d;
    }
    if (goal.repeat_type === "x_per_week") {
      if (goal.any_x_days) return d;
      if (goal.repeat_days && goal.repeat_days.includes(d.getDay())) return d;
    }
  }
  return null;
}

// Add helper for repeat options
const REPEAT_CHIPS = [
  { value: "none", label: "Just once" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "x_per_week", label: "X times per week" },
  { value: "custom_days", label: "Custom days" },
];

export default function DashboardPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState({
    title: "",
    description: "",
    repeat_type: "none",
    repeat_count: 2,
    repeat_days: [] as number[],
    any_x_days: true,
    checkins_per_day: 1,
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    reset_time: "18:00",
  });
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<{
    [goalId: string]: { [date: string]: number };
  }>({});

  // Multi-step modal state
  const [step, setStep] = useState(0);
  const steps = [
    "goal-title",
    "goal-description",
    "goal-repeat",
    "goal-checkins",
    "goal-enddate",
    "goal-review",
  ];

  // On mount, check onboarding requirements
  useEffect(() => {
    const checkOnboarding = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("instagram_username")
        .eq("id", user.id)
        .single();
      // Fetch photo count
      const { count } = await supabase
        .from("profile_photos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!profile?.instagram_username || (count ?? 0) < 1) {
        setShowOnboarding(true);
      }
    };
    checkOnboarding();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("goals")
      .select(
        "id, title, description, repeat_type, repeat_count, repeat_days, any_x_days, checkins_per_day, start_date, end_date, reset_time"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setGoals(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line
  }, []);

  // Fetch checkins for the current week for all goals
  const fetchCheckins = async (goals: Goal[]) => {
    if (!goals.length) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(new Date()), "yyyy-MM-dd");
    const { data } = await supabase
      .from("checkins")
      .select("goal_id, checkin_date, count")
      .eq("user_id", user.id)
      .gte("checkin_date", weekStart)
      .lte("checkin_date", weekEnd);
    // Map to { [goalId]: { [date]: count } }
    const checkinMap: { [goalId: string]: { [date: string]: number } } = {};
    (data || []).forEach((row) => {
      if (!checkinMap[row.goal_id]) checkinMap[row.goal_id] = {};
      checkinMap[row.goal_id][row.checkin_date] = row.count;
    });
    setCheckins(checkinMap);
  };

  // Fetch checkins whenever goals change
  useEffect(() => {
    fetchCheckins(goals);
    // eslint-disable-next-line
  }, [goals]);

  // Helper: is goal active today?
  function isGoalActiveToday(goal: Goal) {
    const today = new Date();
    const start = parseISO(goal.start_date);
    const end = goal.end_date ? parseISO(goal.end_date) : null;
    if (isWithinInterval(today, { start, end: end || today })) {
      if (goal.repeat_type === "none") return false;
      if (goal.repeat_type === "daily") return true;
      if (goal.repeat_type === "weekly")
        return today.getDay() === start.getDay();
      if (goal.repeat_type === "custom_days" && goal.repeat_days)
        return goal.repeat_days.includes(today.getDay());
      if (goal.repeat_type === "x_per_week") {
        if (goal.any_x_days) return true;
        if (goal.repeat_days) return goal.repeat_days.includes(today.getDay());
      }
    }
    return false;
  }

  // Helper: get today's checkin count for a goal
  function getTodayCheckin(goal: Goal) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return checkins[goal.id]?.[todayStr] || 0;
  }

  // Helper: get this week's checkin total for a goal
  function getWeekCheckin(goal: Goal) {
    return Object.values(checkins[goal.id] || {}).reduce((a, b) => a + b, 0);
  }

  // Upsert checkin for today
  async function updateCheckin(goal: Goal, newCount: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    await supabase.from("checkins").upsert({
      goal_id: goal.id,
      user_id: user.id,
      checkin_date: todayStr,
      count: newCount,
    });
    setCheckins((prev) => ({
      ...prev,
      [goal.id]: {
        ...prev[goal.id],
        [todayStr]: newCount,
      },
    }));
  }

  const handleOpen = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setModalState({
        title: goal.title,
        description: goal.description || "",
        repeat_type: goal.repeat_type,
        repeat_count: goal.repeat_count || 2,
        repeat_days: goal.repeat_days || [],
        any_x_days: goal.any_x_days || true,
        checkins_per_day: goal.checkins_per_day,
        start_date: goal.start_date,
        end_date: goal.end_date || "",
        reset_time: goal.reset_time,
      });
    } else {
      setEditingGoal(null);
      setModalState({
        title: "",
        description: "",
        repeat_type: "none",
        repeat_count: 2,
        repeat_days: [],
        any_x_days: true,
        checkins_per_day: 1,
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: "",
        reset_time: "18:00",
      });
    }
    setError(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingGoal(null);
    setError(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setModalState({ ...modalState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in");
      setSubmitting(false);
      return;
    }
    if (!modalState.title) {
      setError("Title is required.");
      setSubmitting(false);
      return;
    }
    // Prepare fields for DB
    const goalPayload = {
      user_id: user.id,
      title: modalState.title,
      description: modalState.description,
      repeat_type: modalState.repeat_type,
      repeat_count:
        modalState.repeat_type === "x_per_week"
          ? modalState.repeat_count
          : null,
      repeat_days:
        modalState.repeat_type === "custom_days" ||
        (modalState.repeat_type === "x_per_week" && !modalState.any_x_days)
          ? modalState.repeat_days
          : null,
      any_x_days:
        modalState.repeat_type === "x_per_week" ? modalState.any_x_days : null,
      checkins_per_day: modalState.checkins_per_day,
      start_date: modalState.start_date,
      end_date: modalState.end_date || null,
      reset_time: modalState.reset_time,
    };
    console.log("Goal payload:", goalPayload);
    if (editingGoal) {
      // Update
      const { error } = await supabase
        .from("goals")
        .update(goalPayload)
        .eq("id", editingGoal.id);
      console.log("Update error:", error);
      if (error) {
        setError(error.message);
      } else {
        setShowModal(false);
        setEditingGoal(null);
        setModalState({
          title: "",
          description: "",
          repeat_type: "none",
          repeat_count: 2,
          repeat_days: [],
          any_x_days: true,
          checkins_per_day: 1,
          start_date: format(new Date(), "yyyy-MM-dd"),
          end_date: "",
          reset_time: "18:00",
        });
        fetchGoals();
      }
    } else {
      // Create
      const { error } = await supabase.from("goals").insert(goalPayload);
      console.log("Insert error:", error);
      if (error) {
        setError(error.message);
      } else {
        setShowModal(false);
        setModalState({
          title: "",
          description: "",
          repeat_type: "none",
          repeat_count: 2,
          repeat_days: [],
          any_x_days: true,
          checkins_per_day: 1,
          start_date: format(new Date(), "yyyy-MM-dd"),
          end_date: "",
          reset_time: "18:00",
        });
        fetchGoals();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (goalId: string) => {
    setDeletingId(goalId);
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    if (!error) fetchGoals();
    setDeletingId(null);
  };

  const handleCheckIn = async (goalId: string) => {
    setCheckInId(goalId);
    const { error } = await supabase
      .from("goals")
      .update({ checked_in_datetime: new Date().toISOString() })
      .eq("id", goalId);
    if (!error) fetchGoals();
    setCheckInId(null);
  };

  const renderSummary = () => {
    const {
      repeat_type,
      repeat_count,
      repeat_days,
      any_x_days,
      checkins_per_day,
      start_date,
      end_date,
      reset_time,
    } = modalState;
    let repeatText = "";
    if (repeat_type === "none") repeatText = "Does not repeat";
    else if (repeat_type === "daily") repeatText = "Every day";
    else if (repeat_type === "weekly") repeatText = "Every week";
    else if (repeat_type === "x_per_week") {
      repeatText = `${repeat_count} times per week`;
      if (!any_x_days && repeat_days.length > 0) {
        repeatText += ` on ${repeat_days.map((d) => DAYS[d]).join(", ")}`;
      } else {
        repeatText += " (any days)";
      }
    } else if (repeat_type === "custom_days") {
      repeatText = `Every ${repeat_days.map((d) => DAYS[d]).join(", ")}`;
    }
    const checkinText =
      checkins_per_day > 1
        ? `${checkins_per_day} times per day`
        : "Once per day";
    const dateText = `from ${start_date}${
      end_date ? ` to ${end_date}` : " (1 year)"
    }`;
    const timeText = `by ${reset_time}`;
    return `${checkinText}, ${repeatText}, ${timeText}, ${dateText}`;
  };

  // Helper for chips
  function Chip({
    selected,
    onClick,
    children,
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) {
    return (
      <button
        type="button"
        className={`px-4 py-2 font-header rounded-full border-2 text-sm transition-all duration-150 ${
          selected
            ? "bg-lime text-black border-lime"
            : "bg-black text-lime border-royal hover:bg-royal hover:text-lime"
        }`}
        style={{ borderRadius: 999 }}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return (
    <AuthGuard>
      {userId && (
        <OnboardingModal
          open={showOnboarding}
          userId={userId}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
      {!showOnboarding && (
        <>
          <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 relative">
            <h2 className="text-3xl font-header uppercase text-royal tracking-widest mb-4">
              Your Goals
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-royal"></div>
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center text-royal text-lg font-header uppercase">
                No goals. Add one to get started!
              </div>
            ) : (
              <div className="space-y-6">
                {goals.map((goal) => {
                  const todayActive = isGoalActiveToday(goal);
                  const todayDone =
                    getTodayCheckin(goal) === goal.checkins_per_day;
                  const nextDay = getNextActiveDay(goal);
                  return (
                    <div
                      key={goal.id}
                      className="bg-jet border-4 border-royal shadow-chess p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      style={{ borderRadius: 0 }}
                    >
                      <div>
                        <h3 className="text-xl font-header uppercase text-lime tracking-widest">
                          {goal.title}
                        </h3>
                        <p className="text-white font-body text-sm mb-2">
                          {goal.description}
                        </p>
                        <p className="text-xs text-royal font-header uppercase">
                          Repeat: {goal.repeat_type}
                        </p>
                        <p className="text-xs text-royal font-header uppercase">
                          Check-ins per day: {goal.checkins_per_day}
                        </p>
                        <p className="text-xs text-royal font-header uppercase">
                          Start: {formatDay(goal.start_date)}
                          {goal.end_date
                            ? ` to ${formatDay(goal.end_date)}`
                            : ""}
                        </p>
                        <p className="text-xs text-royal font-header uppercase">
                          Due by: {formatTime(goal.reset_time)}
                        </p>
                        {/* Progress UI: row of tappable circles or feedback */}
                        {todayActive ? (
                          <div className="mt-2 flex flex-col gap-1">
                            <div className="flex gap-2">
                              {Array.from({
                                length: goal.checkins_per_day,
                              }).map((_, i) => {
                                const checked = i < getTodayCheckin(goal);
                                const disabled = todayDone;
                                return (
                                  <button
                                    key={i}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-header text-lg transition-all duration-150 ${
                                      checked
                                        ? "bg-lime text-black border-lime"
                                        : "bg-black text-lime border-royal"
                                    } ${
                                      disabled
                                        ? "opacity-60 cursor-not-allowed"
                                        : "hover:bg-royal hover:text-lime"
                                    }`}
                                    style={{ borderRadius: "50%" }}
                                    disabled={disabled && !checked}
                                    onClick={() => {
                                      if (checked && !disabled) {
                                        updateCheckin(goal, i);
                                      } else if (!checked && !disabled) {
                                        updateCheckin(goal, i + 1);
                                      }
                                    }}
                                    aria-label={
                                      checked
                                        ? `Undo check-in ${i + 1}`
                                        : `Check in ${i + 1}`
                                    }
                                  >
                                    {checked ? "✓" : i + 1}
                                  </button>
                                );
                              })}
                            </div>
                            {/* Dynamic feedback */}
                            <div
                              className="mt-2 text-xs font-header"
                              style={{
                                color: todayDone ? "#bfff00" : "#a259ff",
                              }}
                            >
                              {todayDone
                                ? `You've completed all check-ins for today! Come back tomorrow.`
                                : getTodayCheckin(goal) > 0
                                ? `Nice work! ${
                                    goal.checkins_per_day -
                                    getTodayCheckin(goal)
                                  } left for today.`
                                : `Tap a circle each time you complete this goal today.`}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs font-header text-royal">
                            {nextDay
                              ? `You can check in on ${formatDay(
                                  format(nextDay, "yyyy-MM-dd")
                                )}.`
                              : `This goal is not active today.`}
                          </div>
                        )}
                        {/* Weekly progress bar for x_per_week */}
                        {goal.repeat_type === "x_per_week" && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-800 h-3 rounded overflow-hidden">
                              <div
                                className="bg-lime h-3 transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (getWeekCheckin(goal) /
                                      (goal.repeat_count || 1)) *
                                      100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <div
                              className="text-xs font-header mt-1"
                              style={{
                                color:
                                  getWeekCheckin(goal) >=
                                  (goal.repeat_count || 1)
                                    ? "#bfff00"
                                    : "#a259ff",
                              }}
                            >
                              {getWeekCheckin(goal)} / {goal.repeat_count || 1}{" "}
                              this week
                              {getWeekCheckin(goal) >= (goal.repeat_count || 1)
                                ? ` (Goal met! Check in next week to keep your streak!)`
                                : ` Keep going!`}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <button
                          className="px-4 py-2 font-header uppercase bg-lime text-jet border-2 border-royal font-bold hover:bg-royal hover:text-lime transition shadow-chess"
                          style={{ borderRadius: 0 }}
                          onClick={() => handleOpen(goal)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-4 py-2 font-header uppercase bg-black text-lime border-2 border-royal hover:bg-royal hover:text-black transition shadow-chess"
                          style={{ borderRadius: 0 }}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this goal?"
                              )
                            )
                              handleDelete(goal.id);
                          }}
                          disabled={deletingId === goal.id}
                        >
                          {deletingId === goal.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              className="fixed bottom-8 right-8 z-30 px-8 py-4 font-header text-lg uppercase tracking-widest bg-royal text-lime font-bold shadow-chess border-4 border-lime transition-all duration-150 hover:animate-jitter flex items-center gap-2"
              style={{ borderRadius: 0 }}
              onClick={() => handleOpen()}
            >
              <span className="text-2xl">♟️</span> Add Goal
            </button>
            {showModal && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
                <form
                  className="bg-jet border-4 border-royal shadow-chess p-8 w-full max-w-md space-y-6"
                  style={{ borderRadius: 0 }}
                  onSubmit={handleSubmit}
                >
                  {/* Stepper UI */}
                  <div className="flex justify-center gap-2 mb-4">
                    {steps.map((s, i) => (
                      <div
                        key={s}
                        className={`w-3 h-3 rounded-full ${
                          i === step ? "bg-lime" : "bg-royal"
                        }`}
                      ></div>
                    ))}
                  </div>
                  {/* Step 1: Title */}
                  {step === 0 && (
                    <>
                      <label className="block font-header text-royal uppercase mb-1 text-lg">
                        What do you want to accomplish?{" "}
                        <span className="text-lime">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={modalState.title}
                        onChange={(e) =>
                          setModalState((s) => ({
                            ...s,
                            title: e.target.value,
                          }))
                        }
                        className="w-full p-2 bg-black text-lime border-2 border-royal font-body"
                        style={{ borderRadius: 0 }}
                        required
                        autoFocus
                        placeholder="e.g. Pray 3 times, Go for a run, Read 10 pages"
                      />
                      <div className="text-xs text-royal mt-2">
                        Be specific! You can always edit this later.
                      </div>
                    </>
                  )}
                  {/* Step 2: Description */}
                  {step === 1 && (
                    <>
                      <label className="block font-header text-royal uppercase mb-1 text-lg">
                        Want to add more details?
                      </label>
                      <textarea
                        name="description"
                        value={modalState.description}
                        onChange={(e) =>
                          setModalState((s) => ({
                            ...s,
                            description: e.target.value,
                          }))
                        }
                        className="w-full p-2 bg-black text-lime border-2 border-royal font-body"
                        style={{ borderRadius: 0 }}
                        rows={3}
                        placeholder="Describe your goal in your own words (optional)"
                      />
                      <div className="text-xs text-royal mt-2">
                        Describe your goal in your own words.
                      </div>
                    </>
                  )}
                  {/* Step 3: Repeat */}
                  {step === 2 && (
                    <>
                      <label className="block font-header text-royal uppercase mb-1 text-lg flex items-center gap-2">
                        How often do you want to check in on this goal?
                        <span className="relative group">
                          <InformationCircleIcon className="w-5 h-5 text-lime inline-block" />
                          <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-black text-lime text-xs p-2 rounded shadow-lg z-50 hidden group-hover:block">
                            Choose how often you want to be held accountable for
                            this goal.
                          </span>
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {REPEAT_CHIPS.map((opt) => (
                          <Chip
                            key={opt.value}
                            selected={modalState.repeat_type === opt.value}
                            onClick={() =>
                              setModalState((s) => ({
                                ...s,
                                repeat_type: opt.value,
                              }))
                            }
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </div>
                      <div className="text-xs text-royal mt-2">
                        You can change this later.
                      </div>
                      {/* If just once, show due date/time */}
                      {modalState.repeat_type === "none" && (
                        <div className="mt-4">
                          <label className="block font-header text-royal uppercase mb-1">
                            When is it due?
                          </label>
                          <input
                            type="datetime-local"
                            value={
                              modalState.start_date +
                              (modalState.reset_time
                                ? `T${modalState.reset_time}`
                                : "")
                            }
                            onChange={(e) => {
                              const [date, time] = e.target.value.split("T");
                              setModalState((s) => ({
                                ...s,
                                start_date: date,
                                reset_time: time || "18:00",
                              }));
                            }}
                            className="p-2 bg-black text-lime border-2 border-royal font-body"
                            style={{ borderRadius: 0 }}
                            required
                          />
                          <div className="text-xs text-royal mt-2">
                            This is a one-time goal. Set the deadline for when
                            it must be completed.
                          </div>
                        </div>
                      )}
                      {/* If custom days, show day-of-week chips */}
                      {modalState.repeat_type === "custom_days" && (
                        <div className="mt-4">
                          <label className="block font-header text-royal uppercase mb-1">
                            Which days do you want to work on this goal?{" "}
                            <span className="text-lime">*</span>
                          </label>
                          <div className="flex gap-2 mb-2">
                            {DAYS.map((d, i) => (
                              <Chip
                                key={d}
                                selected={modalState.repeat_days.includes(i)}
                                onClick={() =>
                                  setModalState((s) => ({
                                    ...s,
                                    repeat_days: s.repeat_days.includes(i)
                                      ? s.repeat_days.filter((day) => day !== i)
                                      : [...s.repeat_days, i],
                                  }))
                                }
                              >
                                {d}
                              </Chip>
                            ))}
                          </div>
                          <div className="text-xs text-royal mt-2">
                            Pick one or more days. You'll be able to change this
                            later.
                          </div>
                        </div>
                      )}
                      {/* If x_per_week, show count and optional day picker */}
                      {modalState.repeat_type === "x_per_week" && (
                        <div className="mt-4">
                          <label className="block font-header text-royal uppercase mb-1">
                            How many days per week do you want to check in?
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={7}
                            value={modalState.repeat_count}
                            onChange={(e) =>
                              setModalState((s) => ({
                                ...s,
                                repeat_count: Math.max(
                                  1,
                                  Math.min(7, Number(e.target.value))
                                ),
                              }))
                            }
                            className="w-24 p-2 bg-black text-lime border-2 border-royal font-body"
                            style={{ borderRadius: 0 }}
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="checkbox"
                              id="any-x-days"
                              checked={modalState.any_x_days}
                              onChange={(e) =>
                                setModalState((s) => ({
                                  ...s,
                                  any_x_days: e.target.checked,
                                }))
                              }
                            />
                            <label
                              htmlFor="any-x-days"
                              className="text-lime font-header text-sm cursor-pointer"
                            >
                              Any {modalState.repeat_count} days (flexible)
                            </label>
                          </div>
                          {!modalState.any_x_days && (
                            <div className="mt-2">
                              <label className="block font-header text-royal uppercase mb-1">
                                Or pick specific days:
                              </label>
                              <div className="flex gap-2 mb-2">
                                {DAYS.map((d, i) => (
                                  <Chip
                                    key={d}
                                    selected={modalState.repeat_days.includes(
                                      i
                                    )}
                                    onClick={() =>
                                      setModalState((s) => ({
                                        ...s,
                                        repeat_days: s.repeat_days.includes(i)
                                          ? s.repeat_days.filter(
                                              (day) => day !== i
                                            )
                                          : [...s.repeat_days, i],
                                      }))
                                    }
                                  >
                                    {d}
                                  </Chip>
                                ))}
                              </div>
                              <div className="text-xs text-royal mt-2">
                                Pick exactly {modalState.repeat_count} days, or
                                switch back to flexible.
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-royal mt-2">
                            You'll need to check in {modalState.repeat_count}{" "}
                            times each week.
                          </div>
                        </div>
                      )}
                      {/* If weekly, show which day (start date's day) */}
                      {modalState.repeat_type === "weekly" && (
                        <div className="mt-4 text-xs text-royal">
                          You'll check in every{" "}
                          {DAYS[parseISO(modalState.start_date).getDay()]}.
                          (Change the start date to pick a different day.)
                        </div>
                      )}
                      {/* If daily, show helper */}
                      {modalState.repeat_type === "daily" && (
                        <div className="mt-4 text-xs text-royal">
                          You'll check in every day.
                        </div>
                      )}
                    </>
                  )}
                  {/* Step 4: Check-ins per day */}
                  {step === 3 && (
                    <>
                      <label className="block font-header text-royal uppercase mb-1 text-lg">
                        How many times per day?
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={modalState.checkins_per_day}
                        onChange={(e) =>
                          setModalState((s) => ({
                            ...s,
                            checkins_per_day: Math.max(
                              1,
                              Number(e.target.value)
                            ),
                          }))
                        }
                        className="w-24 p-2 bg-black text-lime border-2 border-royal font-body"
                        style={{ borderRadius: 0 }}
                      />
                      <div className="text-xs text-royal mt-2">
                        For example, 3 for "Pray 3 times".
                      </div>
                    </>
                  )}
                  {/* Step 5: End date (optional) */}
                  {step === 4 && modalState.repeat_type !== "none" && (
                    <>
                      <label className="block font-header text-royal uppercase mb-1 text-lg">
                        Do you want this goal to end on a certain date?
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          id="set-end-date"
                          checked={!!modalState.end_date}
                          onChange={(e) =>
                            setModalState((s) => ({
                              ...s,
                              end_date: e.target.checked
                                ? format(new Date(), "yyyy-MM-dd")
                                : "",
                            }))
                          }
                        />
                        <label
                          htmlFor="set-end-date"
                          className="text-lime font-header text-sm cursor-pointer"
                        >
                          Set an end date
                        </label>
                      </div>
                      {modalState.end_date && (
                        <input
                          type="date"
                          value={modalState.end_date}
                          min={modalState.start_date}
                          onChange={(e) =>
                            setModalState((s) => ({
                              ...s,
                              end_date: e.target.value,
                            }))
                          }
                          className="p-2 bg-black text-lime border-2 border-royal font-body"
                          style={{ borderRadius: 0 }}
                        />
                      )}
                      <div className="text-xs text-royal mt-2">
                        If you don't set an end date, we'll keep you accountable
                        for a year!
                      </div>
                    </>
                  )}
                  {/* Step 6: Review & Confirm */}
                  {step === 5 && (
                    <>
                      <div className="text-lg font-header text-lime mb-2">
                        Here's what you'll be accountable for:
                      </div>
                      <div
                        className="bg-black border-2 border-lime text-lime font-header text-base p-4 mb-4"
                        style={{ borderRadius: 0 }}
                      >
                        {renderSummary()}
                      </div>
                      <div className="text-xs text-royal mb-2">
                        You can always edit or delete this goal later.
                      </div>
                    </>
                  )}
                  {/* Stepper navigation */}
                  <div className="flex gap-4 justify-between mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 font-header uppercase bg-black text-lime border-2 border-royal hover:bg-royal hover:text-black transition"
                      style={{ borderRadius: 0 }}
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      disabled={step === 0}
                    >
                      Back
                    </button>
                    {step < steps.length - 1 ? (
                      <button
                        type="button"
                        className="px-6 py-2 font-header uppercase bg-lime text-jet border-2 border-royal font-bold hover:bg-royal hover:text-lime transition"
                        style={{ borderRadius: 0 }}
                        onClick={() =>
                          setStep((s) => Math.min(steps.length - 1, s + 1))
                        }
                        disabled={
                          (step === 0 && !modalState.title) ||
                          (step === 2 &&
                            ((modalState.repeat_type === "custom_days" &&
                              modalState.repeat_days.length === 0) ||
                              (modalState.repeat_type === "x_per_week" &&
                                !modalState.any_x_days &&
                                modalState.repeat_days.length !==
                                  modalState.repeat_count))) ||
                          (step === 3 && !modalState.checkins_per_day)
                        }
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-6 py-2 font-header uppercase bg-lime text-jet border-2 border-royal font-bold hover:bg-royal hover:text-lime transition"
                        style={{ borderRadius: 0 }}
                        disabled={submitting}
                      >
                        {editingGoal ? "Save Changes" : "Create Goal 🎉"}
                      </button>
                    )}
                  </div>
                  {error && (
                    <div className="text-red-500 font-header uppercase mt-2">
                      {error}
                    </div>
                  )}
                </form>
              </div>
            )}
            <div className="mt-8 text-center text-royal text-sm font-header uppercase">
              <span>
                Don&apos;t see your goal?{" "}
                <span className="text-lime font-bold">Add one soon!</span>
              </span>
            </div>
          </div>
        </>
      )}
    </AuthGuard>
  );
}
