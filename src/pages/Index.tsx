const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="max-w-4xl text-center">
        <h1 className="mb-6 text-5xl font-bold">🌉 WhatsBridge</h1>
        <p className="mb-8 text-xl text-muted-foreground">
          WhatsApp to WhatsApp Bridge Bot - Ready to Download!
        </p>
        
        <div className="rounded-lg border bg-card p-8 text-left">
          <h2 className="mb-4 text-2xl font-semibold">📦 Download Instructions</h2>
          
          <ol className="space-y-4 text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <span>Click the <strong>GitHub</strong> button (top right) to push this code to your repository</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <span>Clone the repository to your local machine</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <span>Navigate to the <code className="rounded bg-muted px-2 py-1">bot/</code> folder</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <span>Run <code className="rounded bg-muted px-2 py-1">npm install</code> and <code className="rounded bg-muted px-2 py-1">npm run bot</code></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">5.</span>
              <span>See <code className="rounded bg-muted px-2 py-1">SETUP_INSTRUCTIONS.md</code> for complete guide</span>
            </li>
          </ol>

          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm">
              ✨ <strong>Features:</strong> Human-like delays, typing simulation, CLI control, sleep mode, message filtering, and more!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
