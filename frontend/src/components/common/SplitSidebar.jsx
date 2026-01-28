import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const SIDEBAR_WIDTH = 300;

/**
 * SplitSidebar - A sidebar with two always-visible sections (top and bottom)
 * Unlike CollapsibleSidebar which uses accordions, this shows both sections at once.
 */
export default function SplitSidebar({ topSection, bottomSection }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        flexShrink: 0,
      }}
    >
      {/* Toggle Button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title={isCollapsed ? 'Show sidebar' : 'Hide sidebar'} placement="left">
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{
              borderRadius: 0,
              py: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            {isCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Sidebar Content */}
      {!isCollapsed && (
        <Paper
          elevation={0}
          sx={{
            width: SIDEBAR_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          {/* Top Section */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'action.hover',
              }}
            >
              {topSection.icon}
              <Typography variant="subtitle2" fontWeight={600}>
                {topSection.title}
              </Typography>
              {topSection.badge !== undefined && (
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: 'action.selected',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 500,
                  }}
                >
                  {topSection.badge}
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {topSection.content}
            </Box>
          </Box>

          {/* Bottom Section */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'action.hover',
              }}
            >
              {bottomSection.icon}
              <Typography variant="subtitle2" fontWeight={600}>
                {bottomSection.title}
              </Typography>
              {bottomSection.badge !== undefined && (
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: 'action.selected',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 500,
                  }}
                >
                  {bottomSection.badge}
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {bottomSection.content}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
