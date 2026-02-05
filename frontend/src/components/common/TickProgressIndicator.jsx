import { useState, useEffect, useRef, useId } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useGameStore, { NORMAL_TICK_MS, FAST_TICK_MS } from '../../stores/gameStore';

// Number of teeth on the gear
const GEAR_TEETH = 24;
// Degrees to rotate per tick (one tooth)
const ROTATION_PER_TICK = 360 / GEAR_TEETH;

/**
 * GearIcon - SVG gear that can be filled and rotated
 */
function GearIcon({ size = 32, progress = 0, rotation = 0, fillColor, backgroundColor, accentColor }) {
  const id = useId();
  const clipId = `${id}-clip`;
  const maskId = `${id}-mask`;
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.25;
  const toothHeight = size * 0.12;
  const rootRadius = outerRadius - toothHeight * 0.35;
  const tipRadius = outerRadius + toothHeight;
  const toothWidth = 0.7; // Fraction of tooth spacing at the base

  // Generate gear path
  const generateGearPath = () => {
    const points = [];
    const teethCount = GEAR_TEETH;

    for (let i = 0; i < teethCount; i++) {
      const toothPitch = (Math.PI * 2) / teethCount;
      const gapWidth = 1 - toothWidth;

      const baseHalf = (toothWidth / 2) * toothPitch;
      const gapHalf = (gapWidth / 2) * toothPitch;

      const centerAngle = (i + 0.5) * toothPitch - Math.PI / 2;

      const angle1 = centerAngle - (baseHalf + gapHalf); // valley left
      const angle2 = centerAngle - baseHalf; // base left
      const angle3 = centerAngle; // tip center
      const angle4 = centerAngle + baseHalf; // base right
      const angle5 = centerAngle + (baseHalf + gapHalf); // valley right

      // Valley between teeth (root)
      points.push([
        centerX + Math.cos(angle1) * rootRadius,
        centerY + Math.sin(angle1) * rootRadius,
      ]);
      // Base of tooth (left shoulder)
      points.push([
        centerX + Math.cos(angle2) * outerRadius,
        centerY + Math.sin(angle2) * outerRadius,
      ]);
      // Tooth tip (triangle point)
      points.push([
        centerX + Math.cos(angle3) * tipRadius,
        centerY + Math.sin(angle3) * tipRadius,
      ]);
      // Base of tooth (right shoulder)
      points.push([
        centerX + Math.cos(angle4) * outerRadius,
        centerY + Math.sin(angle4) * outerRadius,
      ]);
      // Valley between teeth (root end)
      points.push([
        centerX + Math.cos(angle5) * rootRadius,
        centerY + Math.sin(angle5) * rootRadius,
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
        <clipPath id={clipId}>
          <path d={gearPath} />
          <circle cx={centerX} cy={centerY} r={innerRadius} />
        </clipPath>

        {/* Mask to create the donut shape (gear with hole) */}
        <mask id={maskId}>
          <path d={gearPath} fill="white" />
          <circle cx={centerX} cy={centerY} r={innerRadius} fill="black" />
        </mask>
      </defs>

      {/* Background gear shape */}
      <path d={gearPath} fill={backgroundColor} mask={`url(#${maskId})`} />

      {/* Progress fill - using a pie slice approach */}
      {progress > 0 && progress < 100 && (
        <g mask={`url(#${maskId})`}>
          <path
            d={describeArc(centerX, centerY, outerRadius + toothHeight, -90, -90 + progressAngle)}
            fill={fillColor}
          />
        </g>
      )}
      {progress >= 100 && (
        <path d={gearPath} fill={fillColor} mask={`url(#${maskId})`} />
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
// Brief pause before filling starts (kept inside the tick duration)
const PAUSE_DURATION_FRACTION = 0.15;

const COLOR_CYCLE = [
  { gearIndex: 1, colorIndex: 0 }, // tick 1: right gear, color 1
  { gearIndex: 0, colorIndex: 0 }, // tick 2: left gear, color 1
  { gearIndex: 0, colorIndex: 1 }, // tick 3: left gear, color 2
  { gearIndex: 1, colorIndex: 1 }, // tick 4: right gear, color 2
];

function getCycleForTick(tickNumber) {
  const safeTick = Math.max(1, tickNumber);
  const index = (safeTick - 1) % COLOR_CYCLE.length;
  return COLOR_CYCLE[index];
}

/**
 * TickProgressIndicator - Shows simulation progress with a mechanical gear
 * that fills up and rotates when a tick completes
 */
export default function TickProgressIndicator() {
  const theme = useTheme();
  const isRunning = useGameStore(state => state.isRunning);
  const currentSpeed = useGameStore(state => state.currentSpeed);
  const tick = useGameStore(state => state.engineState?.tick);
  const initialCycle = getCycleForTick((tick ?? 0) + 1);

  // Use a single state object to prevent race conditions between updates
  const [animState, setAnimState] = useState(() => ({
    rotation: 0,
    phase: 'filling', // 'filling' | 'rotating' | 'pausing'
    activeGearIndex: initialCycle.gearIndex, // 0 = left gear, 1 = right gear
    activeColorIndex: initialCycle.colorIndex, // 0 = color1, 1 = color2
    leftProgress: 0,
    rightProgress: 0,
    leftColorIndex: 1, // start with color2
    rightColorIndex: 1, // start with color2
  }));

  const lastTickRef = useRef(tick);
  const lastTickTimeRef = useRef(Date.now());
  const nextTickTimeRef = useRef(null);
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
      const prevTick = lastTickRef.current ?? 0;
      const prevCycle = getCycleForTick(prevTick + 1);
      const nextCycle = getCycleForTick(tick + 1);
      lastTickRef.current = tick;

      const tickDuration = getTickDuration();
      lastTickTimeRef.current = Date.now();
      nextTickTimeRef.current = lastTickTimeRef.current + tickDuration;

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
        rotation: prev.rotation + ROTATION_PER_TICK,
        phase: 'rotating',
        activeGearIndex: prevCycle.gearIndex,
        activeColorIndex: prevCycle.colorIndex,
        leftProgress: 0,
        rightProgress: 0,
        leftColorIndex: prevCycle.gearIndex === 0 ? prevCycle.colorIndex : prev.leftColorIndex,
        rightColorIndex: prevCycle.gearIndex === 1 ? prevCycle.colorIndex : prev.rightColorIndex,
      }));

      // After rotation animation completes, pause while still full, then reset and start filling
      rotationTimeoutRef.current = setTimeout(() => {
        const pauseDuration = tickDuration * PAUSE_DURATION_FRACTION;
        phaseRef.current = 'pausing';
        startTimeRef.current = null;
        setAnimState(prev => ({
          ...prev,
          phase: 'pausing',
          activeGearIndex: nextCycle.gearIndex,
          activeColorIndex: nextCycle.colorIndex,
          leftProgress: 0,
          rightProgress: 0,
        }));

        rotationTimeoutRef.current = setTimeout(() => {
          phaseRef.current = 'filling';
          startTimeRef.current = Date.now();
          setAnimState(prev => ({
            ...prev,
            phase: 'filling',
            activeGearIndex: nextCycle.gearIndex,
            activeColorIndex: nextCycle.colorIndex,
            leftProgress: 0,
            rightProgress: 0,
          }));
        }, pauseDuration);
      }, ROTATION_DURATION_MS);
    }
  }, [tick]);

  // Animate the fill progress
  useEffect(() => {
    // Don't animate if not running
    if (!isRunning) {
      const currentCycle = getCycleForTick((tick ?? 0) + 1);
      phaseRef.current = 'filling';
      setAnimState(prev => ({
        ...prev,
        phase: 'filling',
        activeGearIndex: currentCycle.gearIndex,
        activeColorIndex: currentCycle.colorIndex,
        leftProgress: 0,
        rightProgress: 0,
        leftColorIndex: 1,
        rightColorIndex: 1,
      }));
      startTimeRef.current = null;
      nextTickTimeRef.current = null;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Don't start fill animation while rotating or pausing
    if (animState.phase !== 'filling') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const tickDuration = getTickDuration();

    // Start fresh animation (no pause unless we just rotated)
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      if (!nextTickTimeRef.current) {
        nextTickTimeRef.current = startTimeRef.current + tickDuration;
      }
    }

    const animate = () => {
      // Check ref to avoid animating during rotation or pause
      if (phaseRef.current !== 'filling') {
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const fillEndTime = nextTickTimeRef.current ?? (startTimeRef.current + tickDuration);
      const fillLeadMs = Math.min(250, tickDuration * 0.06);
      const effectiveFillEndTime = fillEndTime - fillLeadMs;
      const fillDuration = Math.max(effectiveFillEndTime - startTimeRef.current, 1);
      const newProgress = Math.min((elapsed / fillDuration) * 100, 100);
      setAnimState(prev => {
        // Double-check we're still in filling phase
        if (prev.phase === 'rotating') return prev;
        if (prev.activeGearIndex === 0) {
          return { ...prev, leftProgress: newProgress, rightProgress: 0 };
        }
        return { ...prev, rightProgress: newProgress, leftProgress: 0 };
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
  }, [isRunning, animState.phase, currentSpeed, tick]);

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

  const {
    rotation,
    leftProgress,
    rightProgress,
    leftColorIndex,
    rightColorIndex,
    activeGearIndex,
    activeColorIndex,
  } = animState;
  const leftGearProgress = leftProgress;
  const rightGearProgress = rightProgress;
  const leftGearRotation = rotation;
  const rightGearRotation = -rotation;
  const gearSize = 28;
  const gearOffsetX = Math.round(gearSize * 0.9) + 1;
  const gearOffsetY = Math.round(gearSize * 0.15);

  // Colors based on speed
  const color1 = currentSpeed === 'fast'
    ? theme.palette.warning.main
    : theme.palette.primary.main;
  const color2 = theme.palette.secondary.light;
  const gearColors = [color1, color2];
  const leftBaseColor = gearColors[leftColorIndex] ?? color2;
  const rightBaseColor = gearColors[rightColorIndex] ?? color2;
  const activeFillColor = gearColors[activeColorIndex] ?? color1;
  const leftFillColor = activeGearIndex === 0 ? activeFillColor : leftBaseColor;
  const rightFillColor = activeGearIndex === 1 ? activeFillColor : rightBaseColor;
  const accentColor = currentSpeed === 'fast'
    ? theme.palette.warning.dark
    : theme.palette.primary.dark;

  if (currentSpeed === 'paused') {
    return (
      <Box
        sx={{
          position: 'relative',
          width: gearSize + gearOffsetX,
          height: gearSize + gearOffsetY + 2,
        }}
      >
        <Box sx={{ position: 'absolute', left: 0, top: -1 }}>
          <GearIcon
            size={gearSize}
            progress={0}
            rotation={leftGearRotation}
            fillColor={leftBaseColor}
            backgroundColor={leftBaseColor}
            accentColor={theme.palette.text.disabled}
          />
        </Box>
        <Box sx={{ position: 'absolute', left: gearOffsetX, top: gearOffsetY + 1 }}>
          <GearIcon
            size={gearSize}
            progress={0}
            rotation={rightGearRotation}
            fillColor={rightBaseColor}
            backgroundColor={rightBaseColor}
            accentColor={theme.palette.text.disabled}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: gearSize + gearOffsetX,
        height: gearSize + gearOffsetY + 2,
      }}
    >
      <Box sx={{ position: 'absolute', left: 0, top: -1 }}>
        <GearIcon
          size={gearSize}
          progress={leftGearProgress}
          rotation={leftGearRotation}
          fillColor={leftFillColor}
          backgroundColor={leftBaseColor}
          accentColor={accentColor}
        />
      </Box>
      <Box sx={{ position: 'absolute', left: gearOffsetX, top: gearOffsetY + 1 }}>
        <GearIcon
          size={gearSize}
          progress={rightGearProgress}
          rotation={rightGearRotation}
          fillColor={rightFillColor}
          backgroundColor={rightBaseColor}
          accentColor={accentColor}
        />
      </Box>
    </Box>
  );
}
