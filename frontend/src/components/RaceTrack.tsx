import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { RaceState } from '../types';
import toast from 'react-hot-toast';

const RaceTrack: React.FC = () => {
  const { ducks, raceState, selectDuck, currentRace, setAnimationWinner } = useGameStore();
  const [raceInProgress, setRaceInProgress] = useState(false);
  const [duckPositions, setDuckPositions] = useState<number[]>([0, 0, 0, 0]);
  const [raceTimeLeft, setRaceTimeLeft] = useState<number>(0);
  const [animationWinner, setLocalAnimationWinner] = useState<number | null>(null);

  // Start race animation when race state changes to RACING
  useEffect(() => {
    if (raceState === RaceState.RACING && !raceInProgress) {
      startRaceAnimation();
    } else if (raceState === RaceState.WAITING) {
      // Only reset positions when waiting for a new race
      setRaceInProgress(false);
      setDuckPositions([0, 0, 0, 0]);
      setRaceTimeLeft(0);
      setLocalAnimationWinner(null);
    }
    // Note: Don't reset duck positions when race finishes to keep them at final positions
  }, [raceState]);

  // Create deterministic random number generator using race info as seed
  const createSeededRandom = (seed: number) => {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  };

  const startRaceAnimation = () => {
    console.log('🏁 Starting 20-second synchronized race animation...');
    setRaceInProgress(true);
    setDuckPositions([0, 0, 0, 0]);
    
    const startTime = Date.now();
    setRaceTimeLeft(20);
    
    // Create deterministic seed based on race info for synchronized animation
    const raceSeed = currentRace ? (currentRace.id * 1000 + Math.floor(currentRace.deadline)) : Date.now();
    const seededRandom = createSeededRandom(raceSeed);
    
    console.log('🎲 Using race seed for synchronized animation:', raceSeed);
    
    // Race duration: exactly 20 seconds
    const RACE_DURATION = 20000; // 20 seconds in milliseconds
    const UPDATE_INTERVAL = 100; // Update every 100ms
    
    // Generate deterministic speeds for each duck (same for all users)
    // Ensure at least one duck reaches close to finish line (90-100%)
    const baseSpeeds = Array.from({ length: 4 }, () => 0.4 + seededRandom() * 0.5); // Speed between 0.4 and 0.9
    
    // Ensure the winning duck gets a high speed to reach finish
    const maxSpeedIndex = baseSpeeds.indexOf(Math.max(...baseSpeeds));
    baseSpeeds[maxSpeedIndex] = Math.max(baseSpeeds[maxSpeedIndex], 0.85); // Winner gets at least 85% speed
    
    console.log('🦆 Duck speeds for this race (synchronized):', baseSpeeds);

    // Update race timer
    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const timeLeft = Math.max(0, Math.ceil((RACE_DURATION - elapsed) / 1000));
      setRaceTimeLeft(timeLeft);
    }, 1000);

    // Main race animation with deterministic movement
    const raceInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / RACE_DURATION, 1); // Progress from 0 to 1
      
      setDuckPositions(prev => 
        prev.map((_, index) => {
          // Each duck progresses based on time and their individual deterministic speed
          const baseProgress = progress * 100; // 0 to 100%
          const speedMultiplier = baseSpeeds[index];
          
          // Use deterministic variation instead of random
          const timeBasedSeed = Math.floor(elapsed / UPDATE_INTERVAL) + index;
          const variationRandom = createSeededRandom(raceSeed + timeBasedSeed);
          const variation = (variationRandom() - 0.5) * 2; // ±1% deterministic variation
          
          const finalPosition = Math.min(100, baseProgress * speedMultiplier + variation);
          return Math.max(0, finalPosition);
        })
      );

      // Stop animation after exactly 20 seconds
      if (elapsed >= RACE_DURATION) {
        clearInterval(raceInterval);
        clearInterval(timerInterval);
        setRaceInProgress(false);
        setRaceTimeLeft(0);
        
        console.log('⏰ 20-second race completed! Determining winner...');
        
        // Determine final winner after 20 seconds - keep ducks at final positions
        setDuckPositions(finalPositions => {
          const maxPosition = Math.max(...finalPositions);
          const winnerIndex = finalPositions.findIndex(pos => pos === maxPosition);
          
          console.log('🏆 Final positions:', finalPositions);
          console.log(`🥇 Duck ${winnerIndex + 1} wins with position: ${maxPosition.toFixed(1)}%`);
          
          // Set local animation winner for UI display
          setLocalAnimationWinner(winnerIndex);
          // Set global animation winner to be used by smart contract
          setAnimationWinner(winnerIndex);
          console.log(`🎯 Animation winner set: Duck ${winnerIndex}`);
          
          // Show winner notification
          toast.success(`🏆 Duck ${winnerIndex + 1} (${ducks[winnerIndex]?.name}) wins the race!`, {
            id: 'animation-winner',
            duration: 10000,
            icon: '🏆'
          });
          
          // Keep ducks at their final positions (don't reset to 0)
          return finalPositions;
        });
      }
    }, UPDATE_INTERVAL);
  };

  const handleDuckClick = (duckId: number) => {
    if (raceState === RaceState.BETTING || raceState === RaceState.RACING) {
      selectDuck(duckId);
    }
  };

  const getDuckTrailColor = (duckId: number) => {
    const colors = ['yellow', 'blue', 'green', 'purple'];
    return colors[duckId] || 'blue';
  };

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Race Track</h2>
        <div className="flex justify-between items-center">
          <p className="text-gray-600 text-sm">
            {raceState === RaceState.BETTING && 'Click on a duck to select it for betting!'}
            {raceState === RaceState.RACING && !raceInProgress && 'Race starting soon... 🏁'}
            {raceState === RaceState.RACING && raceInProgress && 'Ducks are racing! 🏃‍♂️💨'}
            {raceState === RaceState.FINISHED && animationWinner !== null && `Duck ${animationWinner + 1} (${ducks[animationWinner]?.name}) wins the race! 🏆`}
            {raceState === RaceState.FINISHED && animationWinner === null && 'Race finished! Determining winner...'}
            {raceState === RaceState.WAITING && 'Waiting for the next race to begin...'}
          </p>
          {/* Race Timer */}
          {raceInProgress && raceTimeLeft > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Race Time:</span>
              <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                {raceTimeLeft}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Race Track */}
      <div className="race-track min-h-[400px] p-6 relative">
        {/* Finish Line */}
        <div className="absolute right-4 top-0 bottom-0 w-2 bg-gradient-to-b from-red-500 to-red-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold transform -rotate-90 whitespace-nowrap">
            FINISH
          </span>
        </div>

        {/* Duck Lanes */}
        <div className="space-y-6">
          {ducks.map((duck, index) => (
            <div key={duck.id} className="relative h-20">
              {/* Lane Background */}
              <div className="absolute inset-0 bg-blue-50 border-2 border-blue-200 rounded-lg opacity-50" />
              
              {/* Lane Number */}
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-700 border-2 border-gray-300">
                {index + 1}
              </div>

              {/* Progress Track */}
              <div className="absolute left-12 right-12 top-1/2 transform -translate-y-1/2 h-2 bg-gray-200 rounded-full">
                <div 
                  className={`h-full bg-gradient-to-r from-${getDuckTrailColor(index)}-300 to-${getDuckTrailColor(index)}-500 rounded-full transition-all duration-300`}
                  style={{ width: `${duckPositions[index]}%` }}
                />
              </div>

              {/* Duck */}
              <motion.div
                className={`absolute top-1/2 transform -translate-y-1/2 cursor-pointer ${
                  duck.selected && (raceState === RaceState.BETTING || raceState === RaceState.RACING)
                    ? 'ring-4 ring-yellow-400 ring-opacity-75 rounded-full' 
                    : ''
                } ${
                  (raceState === RaceState.BETTING || raceState === RaceState.RACING)
                    ? 'hover:scale-125 transition-transform' 
                    : ''
                }`}
                style={{
                  left: `${12 + (duckPositions[index] * 0.75)}%`,
                }}
                onClick={() => handleDuckClick(duck.id)}
                animate={
                  raceInProgress
                    ? {
                        y: [0, -5, 0],
                        rotate: [-2, 2, -2],
                      }
                    : duck.selected
                    ? {
                        y: [0, -8, 0],
                        scale: [1, 1.1, 1],
                      }
                    : {
                        // No animation when idle
                      }
                }
                transition={{
                  duration: raceInProgress ? 0.5 : duck.selected ? 1.5 : 0,
                  repeat: raceInProgress ? Infinity : duck.selected ? Infinity : 0,
                  ease: "easeInOut",
                }}
                whileHover={(raceState === RaceState.BETTING || raceState === RaceState.RACING) ? { scale: 1.2 } : {}}
                whileTap={(raceState === RaceState.BETTING || raceState === RaceState.RACING) ? { scale: 1.1 } : {}}
              >
                <div className={`text-4xl ${duck.color} filter drop-shadow-lg`}>
                  {duck.emoji}
                </div>
              </motion.div>

              {/* Duck Name */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm font-semibold text-gray-600 bg-white px-2 py-1 rounded border">
                {duck.name}
              </div>

              {/* Winner Crown - Show for animation winner when race is finished */}
              {(raceState === RaceState.FINISHED || !raceInProgress) && animationWinner === duck.id && (
                <motion.div
                  className="absolute top-0 right-2 text-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  👑
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Start Line */}
        <div className="absolute left-4 top-0 bottom-0 w-2 bg-gradient-to-b from-green-500 to-green-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold transform -rotate-90 whitespace-nowrap">
            START
          </span>
        </div>

        {/* Water Ripples Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-20 h-20 border-2 border-blue-300 rounded-full opacity-20"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.1, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Race Instructions */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2 text-blue-800">
          <span className="text-lg">ℹ️</span>
          <div className="text-sm">
            {raceState === RaceState.BETTING && (
              <p><strong>Betting Phase:</strong> Select a duck and place your bet before time runs out!</p>
            )}
            {raceState === RaceState.RACING && (
              <p><strong>Racing Phase:</strong> Race started! You can still bet until the deadline expires!</p>
            )}
            {raceState === RaceState.FINISHED && (
              <p><strong>Race Complete:</strong> Check your winnings and get ready for the next race!</p>
            )}
            {raceState === RaceState.WAITING && (
              <p><strong>Waiting:</strong> Get ready for the next exciting duck race!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceTrack;
