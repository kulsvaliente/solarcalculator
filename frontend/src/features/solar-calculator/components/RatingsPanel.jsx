import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Rating,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import {
  useGetSolarCalculatorRatingsQuery,
  useDeleteSolarCalculatorRatingMutation,
  useAdminLoginMutation
} from '../solarCalculatorRatingsApiSlice';
import {
  useGetSolarCalculatorActivityLogsQuery,
  useDeleteSolarCalculatorActivityLogMutation
} from '../solarCalculatorActivityLogsApiSlice';

// The admin credential itself is checked server-side (POST /admin/login) — nothing secret
// lives in this file. A successful login returns a signed, short-lived token that's sent as
// a Bearer header on the comment-visible fetch and on delete; the backend verifies it there too.
const ADMIN_SESSION_KEY = 'solar_ratings_admin_token';

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

const RatingsPanel = () => {
  const [open, setOpen] = useState(false);
  const [adminToken, setAdminToken] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) || '';
    } catch {
      return '';
    }
  });
  const isAdmin = Boolean(adminToken);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('ratings');

  const { data, isLoading, isFetching } = useGetSolarCalculatorRatingsQuery(
    { page: 1, limit: 100, adminToken },
    { skip: !open }
  );
  const [deleteRating, { isLoading: isDeleting }] = useDeleteSolarCalculatorRatingMutation();
  const [adminLogin, { isLoading: isLoggingIn }] = useAdminLoginMutation();

  const {
    data: logsData,
    isLoading: isLoadingLogs,
    isFetching: isFetchingLogs
  } = useGetSolarCalculatorActivityLogsQuery(
    { page: 1, limit: 100, adminToken },
    { skip: !open || !isAdmin }
  );
  const [deleteActivityLog, { isLoading: isDeletingLog }] = useDeleteSolarCalculatorActivityLogMutation();

  const ratings = data?.data ?? [];
  const averageRating = Number(data?.averageRating) || 0;
  const total = Number(data?.total) || 0;
  const logs = logsData?.data ?? [];
  const totalLogs = Number(logsData?.total) || 0;

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setShowLogin(false);
    setLoginError('');
    setEmail('');
    setPassword('');
    setActiveTab('ratings');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const { token } = await adminLogin({ email: email.trim(), password }).unwrap();
      setAdminToken(token);
      setShowLogin(false);
      setEmail('');
      setPassword('');
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, token);
      } catch {
        /* ignore */
      }
    } catch (err) {
      setLoginError(err?.data?.message || 'Invalid admin credentials.');
    }
  };

  const handleLogout = () => {
    setAdminToken('');
    setActiveTab('ratings');
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rating? This cannot be undone.')) return;
    try {
      await deleteRating({ id, adminToken }).unwrap();
    } catch (err) {
      console.error('Failed to delete rating:', err);
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Delete this solar log entry? This cannot be undone.')) return;
    try {
      await deleteActivityLog({ id, adminToken }).unwrap();
    } catch (err) {
      console.error('Failed to delete activity log:', err);
    }
  };

  return (
    <>
      <Tooltip title="View star ratings">
        <IconButton onClick={handleOpen} sx={{ color: 'primary.main' }} aria-label="View star ratings">
          <StarRoundedIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', pr: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Star Ratings
            </Typography>
            {total > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Rating value={averageRating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  {averageRating.toFixed(1)} / 5 ({total} rating{total === 1 ? '' : 's'})
                </Typography>
              </Box>
            )}
          </Box>
          <IconButton onClick={handleClose} aria-label="Close">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {isAdmin ? (
            <>
              <Alert severity="success" icon={<LockRoundedIcon fontSize="inherit" />} sx={{ mb: 2 }}>
                Signed in as admin — comments and delete are visible below.
              </Alert>
              <Tabs
                value={activeTab}
                onChange={(e, val) => setActiveTab(val)}
                sx={{ mb: 2, minHeight: 36 }}
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab value="ratings" label="Ratings" sx={{ minHeight: 36, py: 0.5 }} />
                <Tab value="logs" label={`Solar Logs${totalLogs ? ` (${totalLogs})` : ''}`} sx={{ minHeight: 36, py: 0.5 }} />
              </Tabs>
            </>
          ) : showLogin ? (
            <Box component="form" onSubmit={handleLogin} sx={{ mb: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Only the admin can log in.
              </Alert>
              <TextField
                label="Admin email"
                type="email"
                fullWidth
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 1.5 }}
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              {loginError && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                  {loginError}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => {
                    setShowLogin(false);
                    setLoginError('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Logging in…' : 'Log in'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="small" startIcon={<LockRoundedIcon />} onClick={() => setShowLogin(true)}>
                Admin
              </Button>
            </Box>
          )}

          {(!isAdmin || activeTab === 'ratings') && (
            isLoading || isFetching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : ratings.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No ratings submitted yet.
              </Typography>
            ) : (
              <List disablePadding>
                {ratings.map((r, idx) => (
                  <React.Fragment key={r._id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem
                      alignItems="flex-start"
                      sx={{ px: 0, py: 1.5 }}
                      secondaryAction={
                        isAdmin ? (
                          <IconButton
                            edge="end"
                            aria-label="Delete rating"
                            onClick={() => handleDelete(r._id)}
                            disabled={isDeleting}
                            color="error"
                          >
                            <DeleteRoundedIcon fontSize="small" />
                          </IconButton>
                        ) : null
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={r.rating} readOnly size="small" />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(r.createdAt)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          isAdmin ? (
                            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.primary' }}>
                              {r.comment || <em>No comment</em>}
                              {r.locationName ? ` — ${r.locationName}` : ''}
                            </Typography>
                          ) : null
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )
          )}

          {isAdmin && activeTab === 'logs' && (
            isLoadingLogs || isFetchingLogs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : logs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No solar logs yet.
              </Typography>
            ) : (
              <List disablePadding>
                {logs.map((log, idx) => (
                  <React.Fragment key={log._id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem
                      alignItems="flex-start"
                      sx={{ px: 0, py: 1.5 }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="Delete solar log"
                          onClick={() => handleDeleteLog(log._id)}
                          disabled={isDeletingLog}
                          color="error"
                        >
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {log.locationName || log.locationInput}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.25 }}>
                            {log.source} · {formatDate(log.createdAt)}
                            {log.searchQuery ? ` · searched "${log.searchQuery}"` : ''}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 1.5 }}>
          {isAdmin ? (
            <Button size="small" color="inherit" startIcon={<LogoutRoundedIcon />} onClick={handleLogout}>
              Log out
            </Button>
          ) : (
            <Box />
          )}
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RatingsPanel;
