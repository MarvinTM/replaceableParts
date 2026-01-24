import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Collapse from '@mui/material/Collapse';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const PANEL_WIDTH = 300;
const COLLAPSED_WIDTH = 48;

/**
 * A collapsible side panel for the main menu.
 *
 * @param {Object} props
 * @param {string} props.title - Panel header title
 * @param {React.ReactNode} props.icon - MUI icon component
 * @param {'left' | 'right'} props.side - Which side of screen
 * @param {React.ReactNode} props.children - Panel content
 * @param {boolean} [props.hasNew] - Show "new" badge indicator
 * @param {boolean} [props.defaultCollapsed] - Start collapsed
 */
export default function InfoPanel({
  title,
  icon,
  side = 'right',
  children,
  hasNew = false,
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => setCollapsed(!collapsed);

  const isLeft = side === 'left';

  return (
    <Paper
      elevation={0}
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : PANEL_WIDTH,
        minHeight: 300,
        maxHeight: 500,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          p: 1,
          borderBottom: collapsed ? 'none' : 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
          minHeight: 48,
        }}
      >
        {collapsed ? (
          <IconButton
            onClick={toggleCollapse}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <Badge
              variant="dot"
              invisible={!hasNew}
              color="error"
              overlap="circular"
            >
              {icon}
            </Badge>
          </IconButton>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge
                variant="dot"
                invisible={!hasNew}
                color="error"
                overlap="circular"
              >
                {icon}
              </Badge>
              <Typography variant="subtitle2" fontWeight="bold">
                {title}
              </Typography>
            </Box>
            <IconButton
              onClick={toggleCollapse}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              {isLeft ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </>
        )}
      </Box>

      {/* Content */}
      <Collapse in={!collapsed} orientation="horizontal" collapsedSize={0}>
        <Box
          sx={{
            width: PANEL_WIDTH,
            flex: 1,
            overflow: 'auto',
            p: 1.5,
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
}
