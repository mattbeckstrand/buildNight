"use client";

import AuthGuard from "@/components/AuthGuard";
import OnboardingModal from "@/components/OnboardingModal";
import UserInfo from "@/components/UserInfo";
import { supabase } from "@/utils/supabaseClient";
import { useEffect, useState } from "react";

interface Goal {
  id: string;
  title: string;
  description: string;
  due_datetime: string;
  checked_in_datetime: string | null;
}

function formatDue(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export default function DashboardPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_datetime: "",
  });
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checkInId, setCheckInId] = useState<string | null>(null);

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
      .select("id, title, description, due_datetime, checked_in_datetime")
      .eq("user_id", user.id)
      .order("due_datetime", { ascending: true });
    setGoals(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line
  }, []);

  const handleOpen = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setForm({
        title: goal.title,
        description: goal.description || "",
        due_datetime: goal.due_datetime.slice(0, 16), // for datetime-local input
      });
    } else {
      setEditingGoal(null);
      setForm({ title: "", description: "", due_datetime: "" });
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
    setForm({ ...form, [e.target.name]: e.target.value });
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
    if (!form.title || !form.due_datetime) {
      setError("Title and due date/time are required.");
      setSubmitting(false);
      return;
    }
    if (editingGoal) {
      // Update
      const { error } = await supabase
        .from("goals")
        .update({
          title: form.title,
          description: form.description,
          due_datetime: form.due_datetime,
        })
        .eq("id", editingGoal.id);
      if (error) {
        setError(error.message);
      } else {
        setShowModal(false);
        setEditingGoal(null);
        setForm({ title: "", description: "", due_datetime: "" });
        fetchGoals();
      }
    } else {
      // Create
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        due_datetime: form.due_datetime,
      });
      if (error) {
        setError(error.message);
      } else {
        setShowModal(false);
        setForm({ title: "", description: "", due_datetime: "" });
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

  // Split goals into active, completed, missed
  const now = new Date();
  const activeGoals = goals.filter(
    (g) => !g.checked_in_datetime && new Date(g.due_datetime) > now
  );
  const completedGoals = goals.filter((g) => g.checked_in_datetime);
  const missedGoals = goals.filter(
    (g) => !g.checked_in_datetime && new Date(g.due_datetime) <= now
  );

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
          <UserInfo />
          <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 relative">
            <h2 className="text-3xl font-header uppercase text-royal tracking-widest mb-4">
              Your Goals
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-royal"></div>
              </div>
            ) : activeGoals.length === 0 ? (
              <div className="text-center text-royal text-lg font-header uppercase">
                No active goals. Add one to get started!
              </div>
            ) : (
              <div className="space-y-6">
                {activeGoals.map((goal) => (
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
                        Due: {formatDue(goal.due_datetime)}
                      </p>
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
                      <button
                        className="px-8 py-4 font-header text-lg uppercase tracking-widest bg-lime text-jet font-bold shadow-chess border-4 border-royal transition-all duration-150 hover:animate-jitter flex items-center gap-2"
                        style={{ borderRadius: 0 }}
                        disabled={
                          !!goal.checked_in_datetime || checkInId === goal.id
                        }
                        onClick={() => handleCheckIn(goal.id)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-7 h-7 text-royal"
                        >
                          <path d="M12 2C10.343 2 9 3.343 9 5c0 1.306.835 2.417 2 2.83V10H8v2h2v2H8v2h2v2H8v2h8v-2h-2v-2h2v-2h-2v-2h2v-2h-3V7.83c1.165-.413 2-1.524 2-2.83 0-1.657-1.343-3-3-3z" />
                        </svg>
                        {goal.checked_in_datetime
                          ? "Checked In"
                          : checkInId === goal.id
                          ? "Checking In..."
                          : "Check In"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Goal History Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-header uppercase text-royal mb-4">
                Goal History
              </h3>
              {completedGoals.length === 0 && missedGoals.length === 0 ? (
                <div className="text-center text-royal text-base font-header uppercase">
                  No goal history yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {completedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-jet border-4 border-lime shadow-chess p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      style={{ borderRadius: 0 }}
                    >
                      <div>
                        <h4 className="text-lg font-header uppercase text-lime">
                          {goal.title}
                        </h4>
                        <p className="text-white font-body text-sm mb-1">
                          {goal.description}
                        </p>
                        <p className="text-xs text-royal font-header uppercase">
                          Due: {formatDue(goal.due_datetime)}
                        </p>
                        <p className="text-xs text-lime font-header uppercase">
                          Checked in: {formatDue(goal.checked_in_datetime!)}
                        </p>
                      </div>
                      <span className="font-header text-lime uppercase">
                        Completed
                      </span>
                    </div>
                  ))}
                  {missedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-jet border-4 border-red-600 shadow-chess p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      style={{ borderRadius: 0 }}
                    >
                      <div>
                        <h4 className="text-lg font-header uppercase text-red-500">
                          {goal.title}
                        </h4>
                        <p className="text-white font-body text-sm mb-1">
                          {goal.description}
                        </p>
                        <p className="text-xs text-royal font-header uppercase">
                          Due: {formatDue(goal.due_datetime)}
                        </p>
                        <p className="text-xs text-red-500 font-header uppercase">
                          Missed
                        </p>
                      </div>
                      <span className="font-header text-red-500 uppercase">
                        Missed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  <h3 className="text-xl font-header uppercase text-lime tracking-widest mb-2">
                    {editingGoal ? "Edit Goal" : "Create a Goal"}
                  </h3>
                  <div>
                    <label className="block font-header text-royal uppercase mb-1">
                      Title*
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      className="w-full p-2 bg-black text-lime border-2 border-royal font-body"
                      style={{ borderRadius: 0 }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-header text-royal uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      className="w-full p-2 bg-black text-lime border-2 border-royal font-body"
                      style={{ borderRadius: 0 }}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block font-header text-royal uppercase mb-1">
                      Due Date & Time*
                    </label>
                    <input
                      type="datetime-local"
                      name="due_datetime"
                      value={form.due_datetime}
                      onChange={handleChange}
                      className="w-full p-2 bg-black text-lime border-2 border-royal font-body"
                      style={{ borderRadius: 0 }}
                      required
                    />
                  </div>
                  {error && (
                    <div className="text-red-500 font-header uppercase">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-4 justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 font-header uppercase bg-black text-lime border-2 border-royal hover:bg-royal hover:text-black transition"
                      style={{ borderRadius: 0 }}
                      onClick={handleClose}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 font-header uppercase bg-lime text-jet border-2 border-royal font-bold hover:bg-royal hover:text-lime transition"
                      style={{ borderRadius: 0 }}
                      disabled={submitting}
                    >
                      {submitting
                        ? editingGoal
                          ? "Saving..."
                          : "Saving..."
                        : editingGoal
                        ? "Save"
                        : "Create"}
                    </button>
                  </div>
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
