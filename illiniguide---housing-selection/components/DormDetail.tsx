import React from 'react';
import { Dorm } from '../types';
import { ArrowLeft, Check, X, MapPin, Home, DollarSign, Utensils } from 'lucide-react';

interface DormDetailProps {
  dorm: Dorm;
  onBack: () => void;
}

const DormDetail: React.FC<DormDetailProps> = ({ dorm, onBack }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <button 
        onClick={onBack}
        className="group flex items-center text-gray-500 hover:text-illini-blue mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Browse
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Image */}
        <div className="h-64 md:h-80 w-full relative">
          <img 
            src={dorm.imageUrl} 
            alt={dorm.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-8 text-white">
              <div className="flex items-center gap-2 mb-2 text-illini-orange font-bold uppercase tracking-wider text-sm">
                <MapPin size={16} /> {dorm.location} Campus
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{dorm.name}</h1>
              <div className="flex flex-wrap gap-2">
                {dorm.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x divide-gray-100">
          
          {/* Main Info */}
          <div className="col-span-2 p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-illini-blue mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {dorm.description}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pros & Cons</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                    <Check size={18} className="mr-2" /> The Good
                  </h4>
                  <ul className="space-y-2">
                    {dorm.pros.map((pro, idx) => (
                      <li key={idx} className="text-green-700 text-sm flex items-start">
                        <span className="mr-2">•</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                    <X size={18} className="mr-2" /> The Not-So-Good
                  </h4>
                  <ul className="space-y-2">
                    {dorm.cons.map((con, idx) => (
                      <li key={idx} className="text-red-700 text-sm flex items-start">
                         <span className="mr-2">•</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Stats */}
          <div className="col-span-1 p-8 bg-gray-50/50 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-700">
                    <Home size={18} className="mr-3 text-illini-blue" />
                    <span>Room Type</span>
                  </div>
                  <span className="font-medium text-gray-900">{dorm.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-700">
                    <Utensils size={18} className="mr-3 text-illini-blue" />
                    <span>Dining Hall</span>
                  </div>
                  <span className={`font-medium ${dorm.dining ? 'text-green-600' : 'text-gray-500'}`}>
                    {dorm.dining ? 'On-site' : 'Nearby'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-700">
                    <DollarSign size={18} className="mr-3 text-illini-blue" />
                    <span>Price Range</span>
                  </div>
                  <span className="font-medium text-gray-900">{dorm.priceRange}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
               <div className="bg-blue-100 rounded-lg p-4">
                 <h4 className="text-illini-blue font-bold text-sm mb-2">Illini Tip</h4>
                 <p className="text-blue-800 text-xs leading-relaxed">
                   {dorm.ac ? "This dorm has A/C, which is a lifesaver in August and September!" : "Bring a box fan! It gets hot in early fall, but the community here is worth it."}
                 </p>
               </div>
            </div>
            
            <button className="w-full py-3 bg-illini-orange hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
              Save to Favorites
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DormDetail;
