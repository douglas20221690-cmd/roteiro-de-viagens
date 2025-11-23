import React from 'react';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  onClick: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onClick }) => {
  // Safe default for image if none provided
  const bgImage = trip.coverImage || `https://picsum.photos/seed/${trip.destination}/600/300`;

  // Fix timezone issue by explicitly parsing YYYY-MM-DD to local midnight
  const getLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <div 
      onClick={() => onClick(trip)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer mb-4"
    >
      <div className="h-32 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <img 
          src={bgImage} 
          alt={trip.destination} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-3 left-4 z-20 text-white">
          <h3 className="text-xl font-bold flex items-center">
            <MapPin size={16} className="mr-1 text-orange-400" />
            {trip.destination}
          </h3>
        </div>
      </div>
      
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center text-slate-500 text-sm">
          <Calendar size={16} className="mr-2 text-blue-500" />
          <span>{getLocalDate(trip.startDate).toLocaleDateString('pt-BR')} - {getLocalDate(trip.endDate).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="bg-slate-100 p-2 rounded-full text-slate-400">
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};