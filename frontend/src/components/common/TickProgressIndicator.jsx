import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useGameStore, { NORMAL_TICK_MS, FAST_TICK_MS } from '../../stores/gameStore';

// Number of teeth on the gear
const GEAR_TEETH = 8;
// Degrees to rotate per tick (one tooth)
const ROTATION_PER_TICK = 360 / GEAR_TEETH;

/**
 * GearIcon - SVG gear that can be filled and rotated
 */
function GearIcon({ size = 32, progress = 0, rotation = 0, fillColor, backgroundColor, accentColor }) {
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.25;
  const toothHeight = size * 0.12;
  const toothWidth = 0.5; // Fraction of tooth spacing

  // Generate gear path
  const generateGearPath = () => {
    const points = [];
    const teethCount = GEAR_TEETH;

    for (let i = 0; i < teethCount; i++) {
      const angle1 = (i / teethCount) * Math.PI * 2 - Math.PI / 2;
      const angle2 = ((i + toothWidth * 0.3) / teethCount) * Math.PI * 2 - Math.PI / 2;
      const angle3 = ((i + toothWidth * 0.7) / teethCount) * Math.PI * 2 - Math.PI / 2;
      const angle4 = ((i + toothWidth) / teethCount) * Math.PI * 2 - Math.PI / 2;
      const angle5 = ((i + 1) / teethCount) * Math.PI * 2 - Math.PI / 2;

      // Base of tooth
      points.push([
        centerX + Math.cos(angle1) * outerRadius,
        centerY + Math.sin(angle1) * outerRadius,
      ]);
      // Outer edge of tooth (left)
      points.push([
        centerX + Math.cos(angle2) * (outerRadius + toothHeight),
        centerY + Math.sin(angle2) * (outerRadius + toothHeight),
      ]);
      // Outer edge of tooth (right)
      points.push([
        centerX + Math.cos(angle3) * (outerRadius + toothHeight),
        centerY + Math.sin(angle3) * (outerRadius + toothHeight),
      ]);
      // Base of tooth (end)
      points.push([
        centerX + Math.cos(angle4) * outerRadius,
        centerY + Math.sin(angle4) * outerRadius,
      ]);
      // Valley between teeth
      points.push([
        centerX + Math.cos(angle5) * outerRadius,
        centerY + Math.sin(angle5) * outerRadius,
      ]);
    }

    return 'M ' + points.map(p => p.join(',')).join(' L ') + ' Z';
  };

  const gearPath = generateGearPath();

  // Calculate the arc for progress (conic gradient effect using clip path)
  const progressAngle = (progress / 100) * 360;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.4s ease-out',
      }}
    >
      <defs>
        {/* Clip path for the gear shape */}
        <clipPath id="gearClip">
          <path d={gearPath} />
          <circle cx={centerX} cy={centerY} r={innerRadius} />
        </clipPath>

        {/* Mask to create the donut shape (gear with hole) */}
        <mask id="gearMask">
          <path d={gearPath} fill="white" />
          <circle cx={centerX} cy={centerY} r={innerRadius} fill="black" />
        </mask>
      </defs>

      {/* Background gear shape */}
      <path d={gearPath} fill={backgroundColor} mask="url(#gearMask)" />

      {/* Progress fill - using a pie slice approach */}
      {progress > 0 && progress < 100 && (
        <g mask="url(#gearMask)">
          <path
            d={describeArc(centerX, centerY, outerRadius + toothHeight, -90, -90 + progressAngle)}
            fill={fillColor}
          />
        </g>
      )}
      {progress >= 100 && (
        <path d={gearPath} fill={fillColor} mask="url(#gearMask)" />
      )}

      {/* Center hole accent */}
      <circle
        cx={centerX}
        cy={centerY}
        r={innerRadius - 2}
        fill="none"
        stroke={accentColor}
        strokeWidth="2"
        opacity="0.5"
      />

      {/* Center dot */}
      <circle cx={centerX} cy={centerY} r={size * 0.06} fill={accentColor} />
    </svg>
  );
}

// Helper function to describe an arc as a pie slice
function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z',
  ].join(' ');
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Duration of the rotation animation in ms
const ROTATION_DURATION_MS = 500;
// Fill up the gear in this fraction of the tick duration (leaves time for rotation while full)
const FILL_DURATION_FRACTION = 0.8;

/**
 * TickProgressIndicator - Shows simulation progress with a mechanical gear
 * that fills up and rotates when a tick completes
 */
export default function TickProgressIndicator() {
  const theme = useTheme();
  const isRunning = useGameStore(state => state.isRunning);
  const currentSpeed = useGameStore(state => state.currentSpeed);
  const tick = useGameStore(state => state.engineState?.tick);

  // Use a single state object to prevent race conditions between updates
  const [animState, setAnimState] = useState({
    progress: 0,
    rotation: 0,
    phase: 'filling', // 'filling' | 'rotating'
  });

  const lastTickRef = useRef(tick);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const rotationTimeoutRef = useRef(null);
  // Use a ref to track phase for the animation loop (avoids stale closure)
  const phaseRef = useRef('filling');

  // Get the tick duration based on current speed
  const getTickDuration = () => {
    if (currentSpeed === 'fast') return FAST_TICK_MS;
    if (currentSpeed === 'normal') return NORMAL_TICK_MS;
    return NORMAL_TICK_MS;
  };

  // Detect tick completion - rotate gear while full, then reset after rotation
  useEffect(() => {
    if (tick !== lastTickRef.current && tick !== undefined) {
      lastTickRef.current = tick;

      // Stop the fill animation immediately
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // Clear any existing timeout
      if (rotationTimeoutRef.current) {
        clearTimeout(rotationTimeoutRef.current);
      }

      // Set to rotating phase with full progress and start rotation
      phaseRef.current = 'rotating';
      setAnimState(prev => ({
        progress: 100,
        rotation: prev.rotation + ROTATION_PER_TICK,
        phase: 'rotating',
      }));

      // After rotation animation completes, reset and start filling again
      rotationTimeoutRef.current = setTimeout(() => {
        phaseRef.current = 'filling';
        startTimeRef.current = Date.now();
        setAnimState(prev => ({
          ...prev,
          progress: 0,
          phase: 'filling',
        }));
      }, ROTATION_DURATION_MS);
    }
  }, [tick]);

  // Animate the fill progress
  useEffect(() => {
    // Don't animate if not running
    if (!isRunning) {
      phaseRef.current = 'filling';
      setAnimState(prev => ({ ...prev, progress: 0, phase: 'filling' }));
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Don't start fill animation while rotating
    if (animState.phase === 'rotating') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Start fresh animation
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const tickDuration = getTickDuration();
    const fillDuration = tickDuration * FILL_DURATION_FRACTION;

    const animate = () => {
      // Check ref to avoid animating during rotation
      if (phaseRef.current === 'rotating') {
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / fillDuration) * 100, 100);
      setAnimState(prev => {
        // Double-check we're still in filling phase
        if (prev.phase === 'rotating') return prev;
        return { ...prev, progress: newProgress };
      });

      if (newProgress < 100 && isRunning && phaseRef.current === 'filling') {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isRunning, animState.phase, currentSpeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rotationTimeoutRef.current) {
        clearTimeout(rotationTimeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const { progress, rotation, phase } = animState;
  // During rotation phase, always show full progress
  const displayProgress = phase === 'rotating' ? 100 : progress;

  // Colors based on speed
  const fillColor = currentSpeed === 'fast'
    ? theme.palette.warning.main
    : theme.palette.primary.main;
  const backgroundColor = theme.palette.action.hover;
  const accentColor = currentSpeed === 'fast'
    ? theme.palette.warning.dark
    : theme.palette.primary.dark;

  if (currentSpeed === 'paused') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GearIcon
          size={28}
          progress={0}
          rotation={rotation}
          fillColor={fillColor}
          backgroundColor={backgroundColor}
          accentColor={theme.palette.text.disabled}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <GearIcon
        size={28}
        progress={displayProgress}
        rotation={rotation}
        fillColor={fillColor}
        backgroundColor={backgroundColor}
        accentColor={accentColor}
      />
    </Box>
  );
}
