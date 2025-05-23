const mockGoals = [
  {
    id: "1",
    title: "Run 5k",
    description: "Get off the couch and run a 5k!",
    due_datetime: "2024-06-10T18:00:00Z",
    checked_in_datetime: null,
  },
  {
    id: "2",
    title: "Read a book",
    description: 'Finish reading "Atomic Habits"',
    due_datetime: "2024-06-12T20:00:00Z",
    checked_in_datetime: null,
  },
];

function formatDue(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export default function DashboardPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h2 className="text-3xl font-header uppercase text-royal tracking-widest mb-4">
        Your Goals
      </h2>
      <div className="space-y-6">
        {mockGoals.map((goal) => (
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
            <button
              className="mt-2 sm:mt-0 px-8 py-4 font-header text-lg uppercase tracking-widest bg-lime text-jet font-bold shadow-chess border-4 border-royal transition-all duration-150 hover:animate-jitter flex items-center gap-2"
              style={{ borderRadius: 0 }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 text-royal"
              >
                <path d="M12 2C10.343 2 9 3.343 9 5c0 1.306.835 2.417 2 2.83V10H8v2h2v2H8v2h2v2H8v2h8v-2h-2v-2h2v-2h-2v-2h2v-2h-3V7.83c1.165-.413 2-1.524 2-2.83 0-1.657-1.343-3-3-3z" />
              </svg>
              Check In
            </button>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center text-royal text-sm font-header uppercase">
        <span>
          Don&apos;t see your goal?{" "}
          <span className="text-lime font-bold">Add one soon!</span>
        </span>
      </div>
    </div>
  );
}
