import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ReplayIcon from '@mui/icons-material/Replay';
import useGameStore from '../../stores/gameStore';
import { getRecipeAge } from '../../utils/researchCosts.js';

const AGE_COLORS = {
  1: '#8B4513',
  2: '#CD7F32',
  3: '#708090',
  4: '#FF8C00',
  5: '#4169E1',
  6: '#9370DB',
  7: '#00CED1',
};

const AGE_NAME_KEYS = {
  1: 'research.stoneAge',
  2: 'research.bronzeAge',
  3: 'research.industrial',
  4: 'research.combustion',
  5: 'research.electric',
  6: 'research.digital',
  7: 'research.future',
};

function buildAgeUnlockProgress(unlockedRecipes, rules) {
  const progress = {};
  const recipesById = new Map((rules?.recipes || []).map((recipe) => [recipe.id, recipe]));

  for (const recipe of rules?.recipes || []) {
    if (recipe.victory) continue;
    const age = getRecipeAge(recipe, rules);
    if (!progress[age]) {
      progress[age] = { total: 0, unlocked: 0 };
    }
    progress[age].total += 1;
  }

  for (const recipeId of unlockedRecipes || []) {
    const recipe = recipesById.get(recipeId);
    if (!recipe || recipe.victory) continue;
    const age = getRecipeAge(recipe, rules);
    if (!progress[age]) {
      progress[age] = { total: 0, unlocked: 0 };
    }
    progress[age].unlocked += 1;
  }

  return progress;
}

function buildConfettiPieces() {
  const colors = ['#FFD700', '#FF8C42', '#00C2A8', '#5AA9FF', '#FF5C8A', '#8DEB6E'];
  return Array.from({ length: 42 }, (_, index) => {
    const size = 6 + Math.floor(Math.random() * 8);
    return {
      id: index,
      left: Math.random() * 100,
      delay: Math.floor(Math.random() * 450),
      duration: 2000 + Math.floor(Math.random() * 1700),
      drift: -35 + Math.random() * 70,
      rotationStart: Math.floor(Math.random() * 360),
      spin: 420 + Math.floor(Math.random() * 620),
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      circle: Math.random() > 0.55,
    };
  });
}

function ConfettiLayer({ runId }) {
  const reduceMotion = useMemo(() => (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ), []);

  const pieces = useMemo(() => buildConfettiPieces(), [runId]);

  if (reduceMotion) {
    return null;
  }

  return (
    <Box
      sx={{
        pointerEvents: 'none',
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {pieces.map((piece) => (
        <Box
          key={`${runId}-${piece.id}`}
          sx={{
            position: 'absolute',
            top: '-12%',
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.circle ? piece.size : Math.max(4, Math.floor(piece.size * 0.55)),
            borderRadius: piece.circle ? '50%' : '2px',
            bgcolor: piece.color,
            opacity: 0,
            transform: `rotate(${piece.rotationStart}deg)`,
            animation: `ageConfettiFall ${piece.duration}ms cubic-bezier(0.21, 0.99, 0.25, 1) ${piece.delay}ms forwards`,
            '@keyframes ageConfettiFall': {
              '0%': {
                opacity: 0,
                transform: `translate3d(0, -20px, 0) rotate(${piece.rotationStart}deg)`,
              },
              '12%': {
                opacity: 1,
              },
              '100%': {
                opacity: 0,
                transform: `translate3d(${piece.drift}px, 120vh, 0) rotate(${piece.rotationStart + piece.spin}deg)`,
              },
            },
          }}
        />
      ))}
    </Box>
  );
}

export default function AgeCompletionNotifier() {
  const { t } = useTranslation();
  const unlockedRecipes = useGameStore((state) => state.engineState?.unlockedRecipes || []);
  const rules = useGameStore((state) => state.rules);

  const [completionQueue, setCompletionQueue] = useState([]);
  const [confettiRunId, setConfettiRunId] = useState(0);

  const initializedRef = useRef(false);
  const prevCompletedAgesRef = useRef(new Set());
  const prevUnlockedCountRef = useRef(0);

  const progressByAge = useMemo(() => buildAgeUnlockProgress(unlockedRecipes, rules), [unlockedRecipes, rules]);

  useEffect(() => {
    const completedAges = new Set(
      Object.entries(progressByAge)
        .filter(([, stats]) => stats.total > 0 && stats.unlocked >= stats.total)
        .map(([age]) => Number(age))
    );

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevCompletedAgesRef.current = completedAges;
      prevUnlockedCountRef.current = unlockedRecipes.length;
      return;
    }

    const newlyCompletedAges = [...completedAges]
      .filter((age) => !prevCompletedAgesRef.current.has(age))
      .sort((a, b) => a - b);

    const unlockedDelta = unlockedRecipes.length - prevUnlockedCountRef.current;
    const isBulkUnlock = unlockedDelta > 1 && newlyCompletedAges.length > 1;

    if (!isBulkUnlock && newlyCompletedAges.length > 0) {
      const queueItems = newlyCompletedAges.map((age) => ({
        age,
        total: progressByAge[age]?.total || 0,
        unlocked: progressByAge[age]?.unlocked || 0,
      }));
      setCompletionQueue((prev) => [...prev, ...queueItems]);
    }

    prevCompletedAgesRef.current = completedAges;
    prevUnlockedCountRef.current = unlockedRecipes.length;
  }, [progressByAge, unlockedRecipes.length]);

  const currentCompletion = completionQueue[0] || null;

  useEffect(() => {
    if (!currentCompletion) return;
    setConfettiRunId((value) => value + 1);
  }, [currentCompletion?.age]);

  useEffect(() => {
    if (!currentCompletion) return undefined;
    const timer = setTimeout(() => {
      setCompletionQueue((prev) => prev.slice(1));
    }, 4500);
    return () => clearTimeout(timer);
  }, [currentCompletion]);

  if (!currentCompletion) {
    return null;
  }

  const ageName = t(AGE_NAME_KEYS[currentCompletion.age] || 'research.age', { age: currentCompletion.age });
  const color = AGE_COLORS[currentCompletion.age] || 'warning.main';

  return (
    <Dialog
      open={Boolean(currentCompletion)}
      onClose={() => setCompletionQueue((prev) => prev.slice(1))}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: 360,
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(180deg, rgba(255, 215, 0, 0.18) 0%, rgba(255, 140, 66, 0.08) 45%, rgba(0, 0, 0, 0) 100%)',
        },
      }}
    >
      <DialogContent sx={{ position: 'relative' }}>
        <ConfettiLayer runId={confettiRunId} />
        <Box
          sx={{
            minHeight: 320,
            py: 4,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            textAlign: 'center',
          }}
        >
          <EmojiEventsIcon
            sx={{
              fontSize: 96,
              color: 'warning.main',
              filter: 'drop-shadow(0 0 16px rgba(255, 193, 7, 0.4))',
              animation: 'ageCompletePop 900ms ease-out',
              '@keyframes ageCompletePop': {
                '0%': { transform: 'scale(0.6)', opacity: 0 },
                '60%': { transform: 'scale(1.1)', opacity: 1 },
                '100%': { transform: 'scale(1)', opacity: 1 },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          />

          <Typography variant="h4" fontWeight="bold" sx={{ color }}>
            {t('research.ageCompleteTitle', { age: currentCompletion.age })}
          </Typography>

          <Chip
            label={`${t('research.age', { age: currentCompletion.age })} - ${ageName}`}
            sx={{
              bgcolor: color,
              color: '#fff',
              fontWeight: 'bold',
            }}
          />

          <Typography variant="body1" color="text.secondary">
            {t('research.ageCompleteSubtitle')}
          </Typography>

          <Typography variant="h6">
            {t('research.ageCompleteProgress', {
              unlocked: currentCompletion.unlocked,
              total: currentCompletion.total,
            })}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <Button
              variant="contained"
              color="warning"
              onClick={() => setCompletionQueue((prev) => prev.slice(1))}
            >
              {t('research.continue')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={() => setConfettiRunId((value) => value + 1)}
            >
              {t('research.replayAnimation')}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
