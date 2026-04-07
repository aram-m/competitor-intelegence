export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#090d15]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          <img
            src="https://cdn.prod.website-files.com/661ce38fc2cbb4e39a655100/66fd12a53afee8c586f8d81c_p2p%20logo.svg"
            alt="P2P logo"
            className="h-6 w-auto"
          />
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary/90">
              P2P Signal Desk
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Competitor Intelligence
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
