
import React from 'react';

const SplashScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <div className="absolute inset-0 z-0">
        <div 
            className="absolute inset-0 bg-cover bg-no-repeat opacity-20 animate-ken-burns" 
            style={{backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop')`}}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
    </div>
    <div className="relative z-10 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white animate-title-glow">SakoonApp</h1>
        <p className="mt-8 text-lg text-cyan-200">लोड हो रहा है, कृपया प्रतीक्षा करें...</p>
    </div>
  </div>
);

export default SplashScreen;
