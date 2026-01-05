import React from 'react';
import Deck from './components/Deck';

function App() {
  return (
    <div className="min-h-screen w-full bg-[#f5f5f7] text-[#1d1d1f] flex flex-col items-center justify-center overflow-hidden">
      {/* Main Content Area */}
      <main className="w-full h-full flex items-center justify-center py-10">
        <Deck />
      </main>
    </div>
  );
}

export default App;