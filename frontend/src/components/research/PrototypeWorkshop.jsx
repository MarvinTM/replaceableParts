import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import BuildIcon from '@mui/icons-material/Build';
import PrototypeCard from './PrototypeCard';
import PrototypeBuildPopup from './PrototypeBuildPopup';
import { getMaterialName } from '../../utils/translationHelpers';

const AGE_FILTERS = [1, 2, 3, 4, 5, 6, 7];
const DEFAULT_SORT = 'age_asc';

export default function PrototypeWorkshop({ awaitingPrototype, rules, inventory }) {
  const { t } = useTranslation();
  const allRecipes = rules?.recipes || [];
  const allMaterials = rules?.materials || [];
  const [selectedPrototypeId, setSelectedPrototypeId] = useState(null);
  const [selectedPrototypeSnapshot, setSelectedPrototypeSnapshot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [selectedAges, setSelectedAges] = useState(() => new Set(AGE_FILTERS));
  const [includeVictory, setIncludeVictory] = useState(true);

  const handleBuildClick = (prototype) => {
    setSelectedPrototypeId(prototype.recipeId);
    setSelectedPrototypeSnapshot(prototype);
  };

  const handleClosePopup = () => {
    setSelectedPrototypeId(null);
    setSelectedPrototypeSnapshot(null);
  };

  const selectedPrototypeFromState = useMemo(() => {
    if (!selectedPrototypeId) return null;
    return awaitingPrototype.find((prototype) => prototype.recipeId === selectedPrototypeId) || null;
  }, [awaitingPrototype, selectedPrototypeId]);

  // Keep an updated snapshot while the prototype still exists in state.
  useEffect(() => {
    if (selectedPrototypeFromState) {
      setSelectedPrototypeSnapshot(selectedPrototypeFromState);
    }
  }, [selectedPrototypeFromState]);

  const selectedPrototype = selectedPrototypeFromState || selectedPrototypeSnapshot;

  const selectedRecipe = useMemo(() => {
    if (!selectedPrototypeId) return null;
    return allRecipes.find((recipe) => recipe.id === selectedPrototypeId) || null;
  }, [allRecipes, selectedPrototypeId]);

  const prototypeEntries = useMemo(() => {
    return awaitingPrototype
      .map((prototype) => {
        const recipe = allRecipes.find((r) => r.id === prototype.recipeId);
        if (!recipe) return null;

        const outputId = Object.keys(recipe.outputs || {})[0];
        const outputMaterial = allMaterials.find((m) => m.id === outputId);
        const age = outputMaterial?.age || recipe?.age || 1;
        const displayName = getMaterialName(outputId, outputMaterial?.name || prototype.recipeId);
        const searchIndex = `${displayName} ${prototype.recipeId} ${outputId || ''}`.toLowerCase();

        return {
          prototype,
          recipe,
          age,
          displayName,
          searchIndex,
          isVictory: Boolean(recipe.victory),
        };
      })
      .filter(Boolean);
  }, [allMaterials, allRecipes, awaitingPrototype]);

  const filteredPrototypeEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = prototypeEntries.filter((entry) => {
      if (normalizedSearch && !entry.searchIndex.includes(normalizedSearch)) {
        return false;
      }

      if (entry.isVictory) {
        return includeVictory;
      }

      return selectedAges.has(entry.age);
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'age_asc' || sortBy === 'age_desc') {
        if (a.age !== b.age) {
          return sortBy === 'age_asc' ? a.age - b.age : b.age - a.age;
        }
        return a.displayName.localeCompare(b.displayName);
      }

      if (sortBy === 'name_desc') {
        return b.displayName.localeCompare(a.displayName);
      }

      return a.displayName.localeCompare(b.displayName);
    });
  }, [includeVictory, prototypeEntries, searchTerm, selectedAges, sortBy]);

  const toggleAge = (age) => {
    setSelectedAges((prev) => {
      const next = new Set(prev);
      if (next.has(age)) {
        next.delete(age);
      } else {
        next.add(age);
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSortBy(DEFAULT_SORT);
    setSelectedAges(new Set(AGE_FILTERS));
    setIncludeVictory(true);
  };

  return (
    <>
      {awaitingPrototype.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
          color: 'text.secondary'
        }}>
          <BuildIcon sx={{ fontSize: 64, opacity: 0.3 }} />
          <Typography variant="body1" textAlign="center">
            {t('research.noPrototypesAwaiting')}
          </Typography>
          <Typography variant="body2" textAlign="center">
            {t('research.runExperimentsToPrototype')}
          </Typography>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <TextField
                size="small"
                label={t('research.searchByName', { defaultValue: 'Search by name' })}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                sx={{ flex: 1, minWidth: 220 }}
              />
              <Box sx={{ minWidth: 250 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    ml: 0.75,
                    mb: 0.125,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('research.sortBy', { defaultValue: 'Sort by' })}
                </Typography>
                <FormControl size="small" sx={{ width: '100%' }}>
                  <Select
                    id="prototype-workshop-sort-select"
                    value={sortBy}
                    inputProps={{ 'aria-label': t('research.sortBy', { defaultValue: 'Sort by' }) }}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <MenuItem value="age_asc">
                      {t('research.prototypeSortAgeAsc', { defaultValue: 'Age: Oldest -> Newest' })}
                    </MenuItem>
                    <MenuItem value="age_desc">
                      {t('research.prototypeSortAgeDesc', { defaultValue: 'Age: Newest -> Oldest' })}
                    </MenuItem>
                    <MenuItem value="name_asc">
                      {t('research.prototypeSortNameAsc', { defaultValue: 'Name: A -> Z' })}
                    </MenuItem>
                    <MenuItem value="name_desc">
                      {t('research.prototypeSortNameDesc', { defaultValue: 'Name: Z -> A' })}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                {t('research.ageFilter', { defaultValue: 'Age filter' })}
              </Typography>
              {AGE_FILTERS.map((age) => (
                <Chip
                  key={age}
                  label={`${t('market.age')} ${age}`}
                  color={selectedAges.has(age) ? 'primary' : 'default'}
                  variant={selectedAges.has(age) ? 'filled' : 'outlined'}
                  size="small"
                  onClick={() => toggleAge(age)}
                />
              ))}
              <Chip
                label={t('research.singularity', { defaultValue: 'Singularity' })}
                color={includeVictory ? 'warning' : 'default'}
                variant={includeVictory ? 'filled' : 'outlined'}
                size="small"
                onClick={() => setIncludeVictory((prev) => !prev)}
              />
              <Button size="small" onClick={resetFilters}>
                {t('research.resetFilters', { defaultValue: 'Reset' })}
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary">
              {t('research.prototypesShowing', {
                defaultValue: 'Showing {{shown}} of {{total}} prototypes',
                shown: filteredPrototypeEntries.length,
                total: prototypeEntries.length,
              })}
            </Typography>
          </Box>

          {filteredPrototypeEntries.length === 0 ? (
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('research.noMatchingPrototypes', { defaultValue: 'No prototypes match the current filters.' })}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'flex-start',
              }}
            >
              {filteredPrototypeEntries.map((entry) => (
                <PrototypeCard
                  key={entry.prototype.recipeId}
                  prototype={entry.prototype}
                  recipe={entry.recipe}
                  rules={rules}
                  onBuildClick={handleBuildClick}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Slots-mode build popup */}
      {selectedPrototype && selectedRecipe && (
        <PrototypeBuildPopup
          open={Boolean(selectedPrototypeId)}
          onClose={handleClosePopup}
          prototype={selectedPrototype}
          recipe={selectedRecipe}
          rules={rules}
          inventory={inventory}
        />
      )}
    </>
  );
}
