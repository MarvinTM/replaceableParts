import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MaterialIcon from '../common/MaterialIcon';

function getFillPercent(fillRatio) {
  if (fillRatio === null || fillRatio === undefined) {
    return null;
  }
  return Math.round(fillRatio * 100);
}

function getRowStatus(row, t) {
  const fillRatio = row.fillRatio ?? null;
  const isFinal = row.category === 'final';
  const isFinalUsedAsPart = isFinal && row.isFinalUsedAsPart;
  const isNearFull = fillRatio !== null && fillRatio >= 0.85;
  const isFull = fillRatio !== null && fillRatio >= 1;
  const isLow = fillRatio !== null && fillRatio <= 0.2;

  if ((!isFinal || isFinalUsedAsPart) && row.deficit) {
    return {
      label: t('game.factory.inventoryStatusDeficit', 'Deficit'),
      color: 'error',
      backgroundColor: 'rgba(244, 67, 54, 0.08)',
      borderColor: 'rgba(244, 67, 54, 0.35)',
    };
  }

  if ((!isFinal || isFinalUsedAsPart) && row.hasThroughput && isLow) {
    return {
      label: t('game.factory.inventoryStatusLow', 'Low'),
      color: 'warning',
      backgroundColor: 'rgba(237, 108, 2, 0.08)',
      borderColor: 'rgba(237, 108, 2, 0.35)',
    };
  }

  if (isFinal && isFull) {
    return {
      label: t('game.factory.inventoryStatusAtCap', 'At cap'),
      color: 'error',
      backgroundColor: 'rgba(244, 67, 54, 0.08)',
      borderColor: 'rgba(244, 67, 54, 0.35)',
    };
  }

  if (isFinal && isNearFull) {
    return {
      label: t('game.factory.inventoryStatusNearCap', 'Near cap'),
      color: 'warning',
      backgroundColor: 'rgba(237, 108, 2, 0.08)',
      borderColor: 'rgba(237, 108, 2, 0.35)',
    };
  }

  if ((!isFinal || isFinalUsedAsPart) && row.hasThroughput && !isLow) {
    return {
      label: t('game.factory.inventoryStatusHealthy', 'Healthy'),
      color: 'success',
      backgroundColor: 'rgba(76, 175, 80, 0.07)',
      borderColor: 'rgba(76, 175, 80, 0.3)',
    };
  }

  return {
    label: null,
    color: 'default',
    backgroundColor: 'transparent',
    borderColor: 'divider',
  };
}

export default function InventoryBrowserDrawer({
  open,
  onClose,
  rows,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('severity');

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      if (normalizedSearch && !row.name.toLowerCase().includes(normalizedSearch) && !row.itemId.toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      if (filter === 'low') {
        return row.fillRatio !== null && row.fillRatio <= 0.2;
      }
      if (filter === 'full') {
        return row.fillRatio !== null && row.fillRatio >= 0.85;
      }
      if (filter === 'deficit') {
        return row.deficit;
      }
      if (filter !== 'all') {
        return row.category === filter;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'quantity') {
        return b.quantity - a.quantity || a.name.localeCompare(b.name);
      }
      if (sortBy === 'fill') {
        return (b.fillRatio ?? -1) - (a.fillRatio ?? -1) || a.name.localeCompare(b.name);
      }
      return b.severity - a.severity || b.quantity - a.quantity || a.name.localeCompare(b.name);
    });
  }, [filter, rows, search, sortBy]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            {t('game.factory.browseAllParts', 'Browse all parts')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('game.factory.uniqueItemsCount', '{{count}} unique items', { count: rows.length })}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, p: 2, pb: 1 }}>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            label={t('game.factory.search', 'Search')}
            size="small"
            sx={{ gridColumn: '1 / -1' }}
          />

          <FormControl size="small">
            <InputLabel id="inventory-filter-label">{t('game.factory.filter', 'Filter')}</InputLabel>
            <Select
              labelId="inventory-filter-label"
              value={filter}
              label={t('game.factory.filter', 'Filter')}
              onChange={(event) => setFilter(event.target.value)}
            >
              <MenuItem value="all">{t('game.factory.filterAll', 'All')}</MenuItem>
              <MenuItem value="raw">{t('game.factory.filterRaw', 'Raw')}</MenuItem>
              <MenuItem value="intermediate">{t('game.factory.filterIntermediate', 'Intermediate')}</MenuItem>
              <MenuItem value="final">{t('game.factory.filterFinal', 'Final')}</MenuItem>
              <MenuItem value="low">{t('game.factory.filterLowStock', 'Low stock')}</MenuItem>
              <MenuItem value="full">{t('game.factory.filterAtCap', 'At cap')}</MenuItem>
              <MenuItem value="deficit">{t('game.factory.filterDeficit', 'Deficit')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel id="inventory-sort-label">{t('game.factory.sort', 'Sort')}</InputLabel>
            <Select
              labelId="inventory-sort-label"
              value={sortBy}
              label={t('game.factory.sort', 'Sort')}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <MenuItem value="severity">{t('game.factory.sortSeverity', 'Severity')}</MenuItem>
              <MenuItem value="name">{t('game.factory.sortName', 'Name')}</MenuItem>
              <MenuItem value="quantity">{t('game.factory.sortQuantity', 'Quantity')}</MenuItem>
              <MenuItem value="fill">{t('game.factory.sortFill', 'Fill %')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, py: 1.5 }}>
          {filteredRows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('game.factory.noMatchingParts', 'No matching parts')}
            </Typography>
          ) : (
            filteredRows.map((row) => {
              const fillPercent = getFillPercent(row.fillRatio);
              const quantityLabel = row.maxStack ? `${row.quantity}/${row.maxStack}` : `${row.quantity}`;
              const status = getRowStatus(row, t);

              return (
                <Box
                  key={row.itemId}
                  sx={{
                    px: 1,
                    py: 0.75,
                    mb: 0.75,
                    border: '1px solid',
                    borderColor: status.borderColor,
                    backgroundColor: status.backgroundColor,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <MaterialIcon
                    materialId={row.itemId}
                    materialName={row.name}
                    category={row.category}
                    size={18}
                  />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap title={row.name}>
                      {row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {quantityLabel}
                      {fillPercent !== null ? ` (${fillPercent}%)` : ''}
                      {row.consumed > 0 || row.produced > 0 ? ` - ${row.consumed}/${row.produced}` : ''}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                    <Chip
                      size="small"
                      label={row.category}
                      variant="outlined"
                      color={row.category === 'final' ? 'primary' : 'default'}
                    />
                    {status.label && (
                      <Chip
                        size="small"
                        label={status.label}
                        color={status.color}
                        variant="filled"
                      />
                    )}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
