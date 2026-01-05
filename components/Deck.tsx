import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useAnimate, PanInfo, useVelocity, useTransform, useSpring } from 'framer-motion';
import Card from './Card';
import { MOCK_CARDS } from '../constants';

const Deck: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const x = useMotionValue(0);
  const [scope, animate] = useAnimate();
  
  // Physics Calculation for "Swinging" effect
  const xVelocity = useVelocity(x);
  
  // Map velocity to rotation: 
  // Fast movement left (neg velocity) -> Card swings bottom-right (positive rotation)
  // Input range: [-1500, 1500] pixels/sec
  // Output range: [12, -12] degrees (Doubled amplitude as requested for stronger effect)
  const rawRotation = useTransform(xVelocity, [-1500, 1500], [12, -12]);
  
  // Apply spring physics to the rotation to create the inertia/pendulum decay
  const physicsSwipe = useSpring(rawRotation, {
    stiffness: 300, // Adjusted stiffness for the larger amplitude
    damping: 20,    // Adjusted damping to prevent excessive wobble
    mass: 1
  });

  const [metrics, setMetrics] = useState({ 
    cardWidth: 300, 
    overlapGap: 0,
    groupGap: 0,
    stride: 332, 
    viewWidth: 664,
    isMobile: false 
  });
  
  const ASPECT_RATIO = 1.3; // Height is 1.3x Width

  // Update metrics on resize to ensure responsiveness
  useEffect(() => {
    const updateMetrics = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      
      let cardWidth;
      let overlapGap;
      let groupGap;

      if (isMobile) {
        // Mobile: Larger cards with overlap
        // Divisor 2.05 allows for ~1.95 cards in view, meaning the 3rd starts entering.
        const widthConstraint = (width - 32) / 2.05; 
        
        // Allow taller cards on mobile
        const heightConstraint = (height * 0.70) / ASPECT_RATIO;

        // Apply 95% scaling factor as requested
        cardWidth = Math.min(widthConstraint, heightConstraint) * 0.95;
        
        // 5% overlap within the pair (negative margin)
        overlapGap = -(cardWidth * 0.05);
        // Positive gap between different pairs (groups)
        groupGap = 16;
      } else {
        // Desktop: standard uniform spacing
        // Apply 95% scaling factor
        cardWidth = 340 * 0.95; 
        overlapGap = 40;
        groupGap = 40;
      }
      
      // Calculate stride for snapping logic. 
      // Since we always snap to even indices (groups), we need the average stride 
      // that results in the correct distance for traversing 2 cards.
      // Distance for 2 cards = Card + OverlapGap + Card + GroupGap
      // Average Stride = Distance / 2
      const stride = (cardWidth * 2 + overlapGap + groupGap) / 2;

      // View width is primarily relevant for the container size.
      // We set it to fit 2 cards plus gaps exactly, hiding the overflow until dragged.
      const viewWidth = (cardWidth * 2) + overlapGap + groupGap;

      setMetrics({ cardWidth, overlapGap, groupGap, stride, viewWidth, isMobile });
      
      // Re-align current position on resize to match new metrics
      const targetX = -(index * stride);
      x.set(targetX);
    };

    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, [index, x]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { stride } = metrics;
    const velocity = info.velocity.x;
    const currentX = x.get();

    // Inertia calculation: predict where the slide would stop based on velocity
    const power = 0.2; 
    const projectedX = currentX + velocity * power;

    // Calculate which "page" (pair of cards) is closest to the projected position
    // We snap to every 2nd card (0, 2, 4...)
    let projectedIndex = Math.round(-projectedX / stride);
    
    // Force snapping to even numbers (pairs)
    if (projectedIndex % 2 !== 0) {
        if (velocity < 0) projectedIndex += 1; // Moving left, go next
        else projectedIndex -= 1; // Moving right, go back
    }

    // Clamp index bounds
    const maxIndex = MOCK_CARDS.length - 2;
    let newIndex = Math.max(0, Math.min(projectedIndex, maxIndex));
    
    // Ensure we snap to an even index to keep the "2 at a time" rhythm
    if (newIndex % 2 !== 0) newIndex -= 1;

    setIndex(newIndex);

    // Animate to the snap point
    const targetX = -(newIndex * stride);
    
    animate(x, targetX, { 
      type: "spring", 
      stiffness: 300, 
      damping: 30,
      mass: 1
    });
  };

  return (
    <div className="relative w-full flex flex-col justify-center items-center">
      
      {/* 
        The Window / Viewport 
        This constrains the visibility.
      */}
      <div 
        ref={containerRef} 
        className="relative flex justify-start items-center touch-pan-y"
        style={{
           width: metrics.viewWidth,
           // Responsive height padding based on aspect ratio
           height: (metrics.cardWidth * ASPECT_RATIO) + (metrics.isMobile ? 50 : 100), 
           perspective: 1000,
        }}
      >
        <motion.div
          ref={scope}
          className="flex items-center absolute left-0"
          style={{ 
            x, 
            // Setup CSS variable for child cards to read
            // @ts-ignore
            '--card-width': `${metrics.cardWidth}px` 
          }}
          drag="x"
          // Constraints: 
          // Left: The furthest we can scroll (showing the last 2 cards)
          // Right: 0 (showing the first 2 cards)
          dragConstraints={{ 
            left: -((MOCK_CARDS.length - 2) * metrics.stride), 
            right: 0 
          }} 
          // Elastic: Creates the iOS rubber-band effect when pulling past limits
          dragElastic={0.2} 
          onDragEnd={handleDragEnd}
          whileTap={{ cursor: "grabbing" }}
        >
          {MOCK_CARDS.map((card, i) => (
             <div 
               key={card.id} 
               className="flex-shrink-0"
               style={{ 
                 // Apply alternating margins based on index
                 // Even index (0, 2...): First card of pair -> use overlapGap
                 // Odd index (1, 3...): Second card of pair -> use groupGap
                 // Last card: 0
                 marginRight: i === MOCK_CARDS.length - 1 
                    ? 0 
                    : (i % 2 === 0 ? metrics.overlapGap : metrics.groupGap)
               }}
             >
               <Card 
                  data={card} 
                  // First card of the pair (even index) gets higher z-index (e.g. 10)
                  // Second card (odd index) gets lower (e.g. 1)
                  zIndex={i % 2 === 0 ? 10 : 1}
                  physicsSwipe={physicsSwipe}
               />
             </div>
          ))}
        </motion.div>
      </div>
      
      {/* Pagination Indicator - Apple Style (Gray/Black) */}
      <div className={`flex justify-center gap-3 ${metrics.isMobile ? 'mt-4' : 'mt-8'}`}>
         {Array.from({ length: Math.ceil(MOCK_CARDS.length / 2) }).map((_, i) => (
           <button
             key={i} 
             onClick={() => {
                const newIndex = i * 2;
                setIndex(newIndex);
                animate(x, -(newIndex * metrics.stride), { type: "spring", stiffness: 300, damping: 30 });
             }}
             className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
               Math.floor(index / 2) === i ? 'w-8 bg-black' : 'w-2 bg-gray-300 hover:bg-gray-400'
             }`} 
           />
         ))}
      </div>
    </div>
  );
};

export default Deck;