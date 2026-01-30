import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Pagination from '@mui/material/Pagination';
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
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      const [statsRes, sessionsRes] = await Promise.all([
        api.getSessionStats(),
        api.getSessions(page, 20)
      ]);
      setStats(statsRes.stats);
      setSessions(sessionsRes.sessions);
      setPagination({
        page: sessionsRes.pagination.page,
        totalPages: sessionsRes.pagination.totalPages
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, page) => {
    loadData(page);
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

  if (loading && !stats) {
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
      <TableContainer component={Paper}>
        <Table>
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
            {sessions.map((session) => (
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
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No sessions found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
