import React, { useState } from 'react';
import DormList from './components/DormList';
import DormDetail from './components/DormDetail';
import AIChat from './components/AIChat';
import { Dorm } from './types';
import { Home } from 'lucide-react';

const App: React.FC = () => {
  const [selectedDorm, setSelectedDorm] = useState<Dorm | null>(null);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 pb-24">
      {/* Navigation Bar */}
      <nav className="bg-illini-blue text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedDorm(null)}>
              <div className="bg-illini-orange p-1.5 rounded-lg">
                <Home size={24} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">Illini<span className="text-illini-orange">Guide</span> Housing</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium bg-blue-800 text-white">Dorms</a>
                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors">Dining</a>
                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors">Resources</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {selectedDorm ? (
          <DormDetail 
            dorm={selectedDorm} 
            onBack={() => setSelectedDorm(null)} 
          />
        ) : (
          <>
            {/* Hero Section */}
            <div className="relative bg-illini-blue overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-illini-blue via-illini-blue/90 to-transparent z-10"></div>
                <img 
                  src="https://picsum.photos/1920/600?random=hero" 
                  alt="UIUC Quad" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-20">
                <div className="max-w-2xl">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
                    Find Your Home at <span className="text-illini-orange">Illinois</span>
                  </h1>
                  <p className="text-xl text-blue-100 mb-8">
                    Navigate the housing lottery with confidence. Compare dorms, check amenities, and ask our AI assistant for personalized recommendations.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => document.getElementById('browse-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-8 py-3 bg-illini-orange text-white font-bold rounded-lg shadow-lg hover:bg-orange-600 transition-all transform hover:-translate-y-1"
                    >
                      Start Browsing
                    </button>
                    <button 
                      className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg border border-white/30 hover:bg-white/20 transition-all"
                    >
                      How it Works
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div id="browse-section">
              <DormList onSelectDorm={setSelectedDorm} />
            </div>
          </>
        )}
      </main>

      <AIChat />
    </div>
  );
};

export default App;
