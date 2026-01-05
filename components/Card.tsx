import React from 'react';
import { CardData } from '../types';
import { ArrowRight } from 'lucide-react';
import { motion, MotionValue, useTransform } from 'framer-motion';

interface CardProps {
  data: CardData;
  zIndex?: number;
  physicsSwipe?: MotionValue<number>;
}

const Card: React.FC<CardProps> = ({ data, zIndex = 0, physicsSwipe }) => {
  // Combine the static layout rotation with the dynamic physics "swing"
  // If physicsSwipe is not provided (fallback), just use static rotation.
  // We use useTransform to add them together dynamically.
  const rotation = useTransform(
    physicsSwipe || new MotionValue(0), 
    (latestPhysics) => latestPhysics + data.rotation
  );

  return (
    <>
      <style>{`
        .card-hover {
          /* Default State (Rest) */
          /* Note: Transform is now handled by Framer Motion styles */
          z-index: var(--z-index);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          
          /* Transition for returning to rest */
          /* We delay z-index change so it stays high while scaling down to avoid clipping */
          transition: 
            box-shadow 0.5s ease-in-out,
            z-index 0s step-end 0.4s; 
        }

        .card-hover:hover {
          /* Hover State */
          z-index: 50; /* High z-index */
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          
          /* Transition for entering hover */
          /* z-index changes immediately (0s duration, no delay) */
          transition: 
            box-shadow 0.5s ease-in-out,
            z-index 0s linear 0s;
        }

        /* Mobile Hover Shadow Override */
        @media (max-width: 768px) {
          .card-hover:hover {
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
          }
        }
      `}</style>

      <motion.div
        className="card-hover relative flex-shrink-0 cursor-pointer group rounded-[32px] border border-white"
        style={{
          // @ts-ignore
          '--z-index': zIndex,
          width: 'var(--card-width)',
          aspectRatio: '1 / 1.3',
          // Bind dynamic rotation here
          rotate: rotation,
        }}
        // Handover scale and rotation resets to Framer Motion during hover
        // This ensures smoothness and compatibility with the physics engine
        whileHover={{ 
            scale: 1.05, 
            rotate: 0,
            transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.98 }}
        // Default transition for physics/rest state
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* 
          Main Card Container 
          Fix for Corner Radius Bug:
          1. transform-gpu: Promotes to own layer.
          2. WebkitMaskImage: Forces the browser to respect the border-radius clipping during transforms.
        */}
        <div 
          className="h-full w-full rounded-[32px] overflow-hidden bg-white relative isolate transform-gpu"
          style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
        >
          
          {/* Background Image with Blur */}
          <div className="absolute inset-0 z-0 bg-gray-100">
             <img 
               src={data.imageUrl} 
               alt={data.description} 
               className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-125 blur-sm scale-110 opacity-90"
             />
             {/* Light Overlay for Text Readability - White Gaussian Filter Effect */}
             <div className="absolute inset-0 bg-white/40" />
          </div>

          {/* Content Layout */}
          <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between z-10">
            
            {/* Top Left: Prompt Content */}
            <div className="flex flex-col items-start space-y-3 text-left">
              <p className="text-sm md:text-2xl font-bold text-gray-900 leading-snug tracking-wide">
                {data.description}
              </p>
            </div>

            {/* Bottom Right: Action Button */}
            <div className="flex w-full justify-end">
              <button 
                // Button style changes based on 'group-hover' (when Card is hovered)
                // Normal: White glassmorphism
                // Hover: Blue background (#0071e3), White text
                // Mobile: Reduced padding and font size (~50% smaller visually)
                className="bg-white/95 backdrop-blur-sm text-black pl-3 pr-2.5 py-1.5 md:pl-6 md:pr-5 md:py-3.5 rounded-full font-bold text-[10px] md:text-sm flex items-center gap-1 md:gap-2 shadow-lg transition-colors duration-300 group-hover:bg-[#0071e3] group-hover:text-white"
              >
                <span>试一试</span>
                <div 
                  // Icon container style changes based on 'group-hover'
                  // Normal: Black bg, White icon
                  // Hover: White bg, Blue icon, Move right 4px (translate-x-1)
                  className="bg-black text-white rounded-full p-0.5 md:p-1 transition-all duration-300 group-hover:bg-white group-hover:text-[#0071e3] group-hover:translate-x-1"
                >
                  <ArrowRight className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" strokeWidth={3} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Card;