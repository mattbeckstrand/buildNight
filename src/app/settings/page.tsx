import Image from "next/image";

const mockPhotos = ["/mock/photo1.jpg", "/mock/photo2.jpg", "/mock/photo3.jpg"];

const mockXAccount = {
  displayName: "Roasty McToastface",
  handle: "@roastmaster",
  avatar: "/mock/avatar.jpg",
};

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-10">
      <h2 className="text-3xl font-header uppercase text-royal tracking-widest mb-4">
        Settings
      </h2>
      <section
        className="bg-jet border-4 border-royal shadow-chess p-6 mb-6"
        style={{ borderRadius: 0 }}
      >
        <h3 className="text-lg font-header uppercase text-lime mb-2 tracking-widest">
          Your Embarrassing Photos
        </h3>
        <div className="flex gap-4 items-center">
          {mockPhotos.map((url, i) => (
            <div key={i} className="relative group">
              <Image
                src={url}
                alt={`Embarrassing ${i + 1}`}
                width={80}
                height={80}
                className="border-4 border-royal object-cover shadow-chess"
                style={{ borderRadius: 0 }}
              />
              <button
                className="absolute top-1 right-1 bg-jet border-2 border-lime p-1 text-lime hover:bg-royal shadow-chess transition font-header uppercase"
                title="Delete"
                style={{ borderRadius: 0 }}
              >
                <span className="flex items-center gap-1">
                  <span className="text-xl">♟️</span>
                </span>
              </button>
            </div>
          ))}
          <button
            className="w-20 h-20 flex items-center justify-center border-4 border-dashed border-royal text-lime hover:bg-royal transition font-header text-3xl font-bold shadow-chess"
            style={{ borderRadius: 0 }}
          >
            <span className="text-3xl">+</span>
          </button>
        </div>
        <p className="text-xs text-lime mt-2 font-header uppercase">
          Exactly 3 photos required. Choose wisely!
        </p>
      </section>
      <section
        className="bg-jet border-4 border-royal shadow-chess p-6 flex items-center gap-4"
        style={{ borderRadius: 0 }}
      >
        <Image
          src={mockXAccount.avatar}
          alt="X avatar"
          width={48}
          height={48}
          className="border-4 border-royal shadow-chess"
          style={{ borderRadius: 0 }}
        />
        <div>
          <div className="font-header text-lime uppercase tracking-widest">
            {mockXAccount.displayName}
          </div>
          <div className="text-royal font-header uppercase">
            {mockXAccount.handle}
          </div>
        </div>
        <button
          className="ml-auto px-4 py-2 font-header uppercase tracking-widest bg-lime text-jet font-bold shadow-chess border-4 border-royal transition-all duration-150 hover:animate-jitter flex items-center gap-2"
          style={{ borderRadius: 0 }}
        >
          <span className="text-xl">♟️</span> Disconnect X
        </button>
      </section>
    </div>
  );
}
