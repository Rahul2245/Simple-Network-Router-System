import React from 'react';
import { Network } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-16 border-b border-[#2d333b] bg-[#161b22] px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <div className="bg-[#00ffa3]/10 p-2 rounded-md border border-[#00ffa3]/30">
           <Network className="w-5 h-5 text-accentGreen" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-100 flex items-center gap-1">
          Router Simulator <span className="text-[#00ffa3] font-black text-sm uppercase self-end mb-1 ml-2">v1.0</span>
        </h1>
      </div>
      
      <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
        <a href="#" className="hover:text-accentGreen text-accentGreen transition-colors border-b-2 border-accentGreen pb-1">Topology</a>
        <a href="#" className="hover:text-gray-200 transition-colors border-b-2 border-transparent pb-1">Settings</a>
      </nav>
    </header>
  );
};

export default Header;
