import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-jet p-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <Image
          src="/checkmate.png"
          alt="CheckMate Logo"
          width={80}
          height={80}
          className="mx-auto shadow-chess"
        />
        <h1 className="text-4xl sm:text-5xl font-header uppercase text-royal drop-shadow-lg tracking-widest">
          CheckMate
        </h1>
        <p className="text-lg sm:text-xl text-white font-body">
          The public accountability app that{" "}
          <span className="font-bold text-lime">roasts you on X</span> if you
          miss your goals. Upload your most embarrassing photos, set your goals,
          and let your friends (and the world) keep you honest!
        </p>
        <div className="bg-jet border-4 border-royal shadow-chess p-6 space-y-4 text-left">
          <ul className="text-white font-body space-y-2">
            <li className="flex items-center gap-2">
              ♟️ Only X (Twitter) login
            </li>
            <li className="flex items-center gap-2">
              ♟️ Upload 3 embarrassing photos
            </li>
            <li className="flex items-center gap-2">
              ♟️ Set public goals with deadlines
            </li>
            <li className="flex items-center gap-2">
              ♟️ Miss a check-in? We post a roast with your photo on X!
            </li>
          </ul>
          <button
            className="mt-4 w-full py-4 px-6 font-header text-xl uppercase tracking-widest bg-lime text-jet font-bold shadow-chess border-4 border-royal transition-all duration-150 hover:animate-jitter flex items-center justify-center gap-2"
            style={{ borderRadius: 0 }}
          >
            <span className="inline-flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 text-royal"
              >
                <path d="M12 2C10.343 2 9 3.343 9 5c0 1.306.835 2.417 2 2.83V10H8v2h2v2H8v2h2v2H8v2h8v-2h-2v-2h2v-2h-2v-2h2v-2h-3V7.83c1.165-.413 2-1.524 2-2.83 0-1.657-1.343-3-3-3z" />
              </svg>
              Login with X
            </span>
          </button>
          <p className="text-xs text-lime mt-2 font-header uppercase">
            We only post if you miss your goal. Your secrets are safe... unless
            you fail! 😈
          </p>
        </div>
      </div>
    </main>
  );
}
