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

/**
 * TickProgressIndicator - Shows simulation progress with a mechanical gear
 * that fills up and rotates when a tick completes
 */
export default function TickProgressIndicator() {
  const theme = useTheme();
  const isRunning = useGameStore(state => state.isRunning);
  const currentSpeed = useGameStore(state => state.currentSpeed);
  const tick = useGameStore(state => state.engineState?.tick);
  const initialGearIndex = (tick ?? 0) % 2;

  // Use a single state object to prevent race conditions between updates
  const [animState, setAnimState] = useState(() => ({
    rotation: 0,
    phase: 'filling', // 'filling' | 'rotating' | 'pausing'
    activeGearIndex: initialGearIndex, // 0 = left gear, 1 = right gear
    leftProgress: initialGearIndex === 0 ? 0 : 100,
    rightProgress: initialGearIndex === 0 ? 100 : 0,
  }));

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
      const prevTick = lastTickRef.current ?? 0;
      const prevGearIndex = prevTick % 2;
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
        rotation: prev.rotation + ROTATION_PER_TICK,
        phase: 'rotating',
        activeGearIndex: prevGearIndex,
        leftProgress: 100,
        rightProgress: 100,
      }));

      // After rotation animation completes, pause while still full, then reset and start filling
      rotationTimeoutRef.current = setTimeout(() => {
        const nextGearIndex = tick % 2;
        const tickDuration = getTickDuration();
        const pauseDuration = tickDuration * PAUSE_DURATION_FRACTION;
        phaseRef.current = 'pausing';
        startTimeRef.current = null;
        setAnimState(prev => ({
          ...prev,
          phase: 'pausing',
          activeGearIndex: nextGearIndex,
          leftProgress: 100,
          rightProgress: 100,
        }));

        rotationTimeoutRef.current = setTimeout(() => {
          phaseRef.current = 'filling';
          startTimeRef.current = Date.now();
          setAnimState(prev => ({
            ...prev,
            phase: 'filling',
            activeGearIndex: nextGearIndex,
            leftProgress: nextGearIndex === 0 ? 0 : 100,
            rightProgress: nextGearIndex === 1 ? 0 : 100,
          }));
        }, pauseDuration);
      }, ROTATION_DURATION_MS);
    }
  }, [tick]);

  // Animate the fill progress
  useEffect(() => {
    // Don't animate if not running
    if (!isRunning) {
      const currentGearIndex = (tick ?? 0) % 2;
      phaseRef.current = 'filling';
      setAnimState(prev => ({
        ...prev,
        phase: 'filling',
        activeGearIndex: currentGearIndex,
        leftProgress: 0,
        rightProgress: 0,
      }));
      startTimeRef.current = null;
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
    const pauseDuration = tickDuration * PAUSE_DURATION_FRACTION;
    const fillDuration = Math.max(tickDuration - ROTATION_DURATION_MS - pauseDuration, 1);

    // Start fresh animation (no pause unless we just rotated)
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
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

      const newProgress = Math.min((elapsed / fillDuration) * 100, 100);
      setAnimState(prev => {
        // Double-check we're still in filling phase
        if (prev.phase === 'rotating') return prev;
        if (prev.activeGearIndex === 0) {
          return { ...prev, leftProgress: newProgress };
        }
        return { ...prev, rightProgress: newProgress };
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

  const { rotation, phase, leftProgress, rightProgress } = animState;
  const leftGearProgress = phase === 'rotating' ? 100 : leftProgress;
  const rightGearProgress = phase === 'rotating' ? 100 : rightProgress;
  const leftGearRotation = rotation;
  const rightGearRotation = -rotation;
  const gearSize = 28;
  const gearOffsetX = Math.round(gearSize * 0.9) + 1;
  const gearOffsetY = Math.round(gearSize * 0.15);

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
            fillColor={fillColor}
            backgroundColor={backgroundColor}
            accentColor={theme.palette.text.disabled}
          />
        </Box>
        <Box sx={{ position: 'absolute', left: gearOffsetX, top: gearOffsetY + 1 }}>
          <GearIcon
            size={gearSize}
            progress={0}
            rotation={rightGearRotation}
            fillColor={fillColor}
            backgroundColor={backgroundColor}
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
          fillColor={fillColor}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
        />
      </Box>
      <Box sx={{ position: 'absolute', left: gearOffsetX, top: gearOffsetY + 1 }}>
        <GearIcon
          size={gearSize}
          progress={rightGearProgress}
          rotation={rightGearRotation}
          fillColor={fillColor}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
        />
      </Box>
    </Box>
  );
}
