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
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PendingIcon from '@mui/icons-material/Pending';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import SessionsTab from '../components/admin/SessionsTab';

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

export default function AdminPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        api.getUsers(),
        api.getAdminStats()
      ]);
      setUsers(usersRes.users);
      setStats(statsRes.stats);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUser(null);
  };

  const openConfirmDialog = (type) => {
    setConfirmDialog({ open: true, type });
    setMenuAnchor(null);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, type: null });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleApprove = async () => {
    try {
      await api.updateUserPermissions(selectedUser.id, { isApproved: true });
      showSnackbar(t('admin.success.approved'));
      loadData();
    } catch (err) {
      showSnackbar(t('admin.error.generic'), 'error');
    }
    handleMenuClose();
  };

  const handleRevoke = async () => {
    try {
      await api.updateUserPermissions(selectedUser.id, { isApproved: false });
      showSnackbar(t('admin.success.revoked'));
      loadData();
    } catch (err) {
      showSnackbar(t('admin.error.generic'), 'error');
    }
    closeConfirmDialog();
    handleMenuClose();
  };

  const handleRoleChange = async () => {
    try {
      const newRole = selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
      await api.updateUserPermissions(selectedUser.id, { role: newRole });
      showSnackbar(t('admin.success.roleChanged'));
      loadData();
    } catch (err) {
      showSnackbar(t('admin.error.generic'), 'error');
    }
    closeConfirmDialog();
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      await api.deleteUser(selectedUser.id);
      showSnackbar(t('admin.success.deleted'));
      loadData();
    } catch (err) {
      showSnackbar(t('admin.error.generic'), 'error');
    }
    closeConfirmDialog();
    handleMenuClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('admin.users.never');
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
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
      <Typography variant="h4" gutterBottom>
        {t('admin.title')}
      </Typography>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={t('admin.tabs.users')} />
        <Tab label={t('admin.tabs.sessions')} />
      </Tabs>

      {/* Users Tab */}
      {activeTab === 0 && (
        <>
          {/* Stats Cards */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title={t('admin.stats.totalUsers')}
                  value={stats.totalUsers}
                  icon={PeopleIcon}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title={t('admin.stats.approvedUsers')}
                  value={stats.approvedUsers}
                  icon={HowToRegIcon}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title={t('admin.stats.pendingUsers')}
                  value={stats.pendingUsers}
                  icon={PendingIcon}
                  color="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title={t('admin.stats.adminCount')}
                  value={stats.adminCount}
                  icon={SupervisorAccountIcon}
                  color="secondary"
                />
              </Grid>
            </Grid>
          )}

          {/* Users Table */}
          <Typography variant="h6" gutterBottom>
            {t('admin.users.title')}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.users.name')}</TableCell>
                  <TableCell>{t('admin.users.email')}</TableCell>
                  <TableCell>{t('admin.users.role')}</TableCell>
                  <TableCell>{t('admin.users.status')}</TableCell>
                  <TableCell>{t('admin.users.lastLogin')}</TableCell>
                  <TableCell align="right">{t('admin.users.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={user.picture} alt={user.name} sx={{ width: 32, height: 32 }} />
                        <span>
                          {user.name}
                          {user.id === currentUser.id && (
                            <Typography component="span" color="primary" sx={{ ml: 1 }}>
                              {t('admin.users.you')}
                            </Typography>
                          )}
                        </span>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === 'ADMIN' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isApproved ? t('admin.users.approved') : t('admin.users.pending')}
                        size="small"
                        color={user.isApproved ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user)}
                        disabled={user.id === currentUser.id}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Sessions Tab */}
      {activeTab === 1 && <SessionsTab />}

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedUser && !selectedUser.isApproved && (
          <MenuItem onClick={handleApprove}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>{t('admin.users.approve')}</ListItemText>
          </MenuItem>
        )}
        {selectedUser && selectedUser.isApproved && (
          <MenuItem onClick={() => openConfirmDialog('revoke')}>
            <ListItemIcon>
              <BlockIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>{t('admin.users.revoke')}</ListItemText>
          </MenuItem>
        )}
        {selectedUser && selectedUser.role !== 'ADMIN' && (
          <MenuItem onClick={() => openConfirmDialog('makeAdmin')}>
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <ListItemText>{t('admin.users.makeAdmin')}</ListItemText>
          </MenuItem>
        )}
        {selectedUser && selectedUser.role === 'ADMIN' && (
          <MenuItem onClick={() => openConfirmDialog('removeAdmin')}>
            <ListItemIcon>
              <PersonRemoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('admin.users.removeAdmin')}</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => openConfirmDialog('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>{t('admin.users.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
        <DialogTitle>
          {confirmDialog.type === 'delete' ? t('common.delete') : t('common.confirm')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.type === 'delete' && t('admin.confirmDelete')}
            {(confirmDialog.type === 'makeAdmin' || confirmDialog.type === 'removeAdmin') &&
              t('admin.confirmRoleChange')}
            {confirmDialog.type === 'revoke' && t('admin.confirmRoleChange')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>{t('common.cancel')}</Button>
          <Button
            onClick={() => {
              if (confirmDialog.type === 'delete') handleDelete();
              else if (confirmDialog.type === 'makeAdmin' || confirmDialog.type === 'removeAdmin')
                handleRoleChange();
              else if (confirmDialog.type === 'revoke') handleRevoke();
            }}
            color={confirmDialog.type === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
