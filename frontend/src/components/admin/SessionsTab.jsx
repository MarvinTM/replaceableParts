import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import { api } from '../../services/api';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: `${color}.dark`,
            display: 'flex'
          }}
        >
          <Icon sx={{ color: `${color}.light` }} />
        </Box>
        <Box>
          <Typography variant="h4">{value}</Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function AgeDistributionChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 80 }}>
      {data.map(item => (
        <Box
          key={item.age}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 40,
              height: Math.max((item.count / maxCount) * 60, 4),
              backgroundColor: 'primary.main',
              borderRadius: 1
            }}
          />
          <Typography variant="caption" sx={{ mt: 0.5 }}>
            {item.age}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function SessionsTab() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    user: '',
    sessionType: 'all',
    startDate: '',
    endDate: ''
  });
  const [debouncedUserFilter, setDebouncedUserFilter] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedUserFilter(filters.user.trim());
    }, 300);

    return () => clearTimeout(timerId);
  }, [filters.user]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [page, rowsPerPage, debouncedUserFilter, filters.sessionType, filters.startDate, filters.endDate]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const statsRes = await api.getSessionStats();
      setStats(statsRes.stats);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const sessionsRes = await api.getSessions(page, rowsPerPage, {
        user: debouncedUserFilter,
        sessionType: filters.sessionType !== 'all' ? filters.sessionType : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });
      setSessions(sessionsRes.sessions);
      setTotalSessions(sessionsRes.pagination.total);
      setTotalPages(sessionsRes.pagination.totalPages || 1);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handlePageChange = (event, nextPage) => {
    setPage(nextPage + 1);
  };

  const handleRowsPerPageChange = (event) => {
    const nextRowsPerPage = Number.parseInt(event.target.value, 10);
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
  };

  const handleFilterChange = (field, value) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      user: '',
      sessionType: 'all',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if ((statsLoading || sessionsLoading) && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('admin.sessions.totalSessions')}
              value={stats.totalSessions}
              icon={HistoryIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('admin.sessions.activeSessions')}
              value={stats.activeSessions}
              icon={PlayArrowIcon}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title={t('admin.sessions.avgDuration')}
              value={formatDuration(stats.avgDuration)}
              icon={TimerIcon}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUpIcon color="secondary" />
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.sessions.ageDistribution')}
                  </Typography>
                </Box>
                <AgeDistributionChart data={stats.ageDistribution} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Sessions Table */}
      <Typography variant="h6" gutterBottom>
        {t('admin.sessions.recentSessions')}
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('admin.sessions.filterUser', 'Filter by user')}
              value={filters.user}
              onChange={(event) => handleFilterChange('user', event.target.value)}
              placeholder={t('admin.sessions.filterUserPlaceholder', 'Name or email')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel id="session-type-filter-label">
                {t('admin.sessions.filterType', 'Type')}
              </InputLabel>
              <Select
                labelId="session-type-filter-label"
                label={t('admin.sessions.filterType', 'Type')}
                value={filters.sessionType}
                onChange={(event) => handleFilterChange('sessionType', event.target.value)}
              >
                <MenuItem value="all">{t('admin.sessions.allTypes', 'All')}</MenuItem>
                <MenuItem value="new">{t('admin.sessions.typeNew', 'New')}</MenuItem>
                <MenuItem value="load">{t('admin.sessions.typeLoad', 'Load')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label={t('admin.sessions.filterStartDate', 'From')}
              type="date"
              value={filters.startDate}
              onChange={(event) => handleFilterChange('startDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label={t('admin.sessions.filterEndDate', 'To')}
              type="date"
              value={filters.endDate}
              onChange={(event) => handleFilterChange('endDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Stack direction="row" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                disabled={
                  !filters.user &&
                  filters.sessionType === 'all' &&
                  !filters.startDate &&
                  !filters.endDate
                }
              >
                {t('admin.sessions.clearFilters', 'Clear')}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ maxHeight: 560, overflow: 'auto' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t('admin.sessions.user')}</TableCell>
              <TableCell>{t('admin.sessions.type')}</TableCell>
              <TableCell>{t('admin.sessions.started')}</TableCell>
              <TableCell>{t('admin.sessions.duration')}</TableCell>
              <TableCell>{t('admin.sessions.ageProgress')}</TableCell>
              <TableCell>{t('admin.sessions.machines')}</TableCell>
              <TableCell>{t('admin.sessions.factorySize')}</TableCell>
              <TableCell>{t('admin.sessions.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessionsLoading && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {!sessionsLoading && sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={session.user?.picture}
                      alt={session.user?.name}
                      sx={{ width: 32, height: 32 }}
                    />
                    <Box>
                      <Typography variant="body2">
                        {session.user?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {session.user?.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={session.sessionType}
                    size="small"
                    color={session.sessionType === 'new' ? 'primary' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatDate(session.startedAt)}</TableCell>
                <TableCell>{formatDuration(session.durationSeconds)}</TableCell>
                <TableCell>
                  {session.startingAge} → {session.currentAge}
                </TableCell>
                <TableCell>{session.maxMachines}</TableCell>
                <TableCell>
                  {session.factoryWidth} x {session.factoryHeight}
                </TableCell>
                <TableCell>
                  <Chip
                    label={session.isActive ? t('admin.sessions.active') : t('admin.sessions.ended')}
                    size="small"
                    color={session.isActive ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!sessionsLoading && sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    {t('admin.sessions.noSessionsFound', 'No sessions found')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper sx={{ mt: 2 }}>
        <TablePagination
          component="div"
          count={totalSessions}
          page={Math.max(page - 1, 0)}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage={t('admin.sessions.rowsPerPage', 'Rows per page')}
          labelDisplayedRows={({ from, to, count }) =>
            t('admin.sessions.rowsDisplayed', '{{from}}-{{to}} of {{count}}', {
              from,
              to,
              count
            })
          }
          nextIconButtonProps={{ disabled: page >= totalPages }}
        />
      </Paper>
    </Box>
  );
}
