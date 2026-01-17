import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const SIDEBAR_WIDTH = 300;

export default function CollapsibleSidebar({ sections, defaultExpanded = null, expanded = null, onExpandedChange = null }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalExpandedSection, setInternalExpandedSection] = useState(defaultExpanded || (sections[0]?.id ?? null));

  // Use controlled expanded if provided, otherwise use internal state
  const expandedSection = expanded !== null ? expanded : internalExpandedSection;

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    const newExpanded = isExpanded ? panel : null;

    // Update internal state
    setInternalExpandedSection(newExpanded);

    // Call external handler if provided
    if (onExpandedChange) {
      onExpandedChange(newExpanded);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
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
            height: '100%',
            overflow: 'auto',
            borderLeft: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          {sections.map((section) => (
            <Accordion
              key={section.id}
              expanded={expandedSection === section.id}
              onChange={handleAccordionChange(section.id)}
              disableGutters
              elevation={0}
              sx={{
                '&:before': { display: 'none' },
                '&.Mui-expanded': { margin: 0 },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  minHeight: 48,
                  '&.Mui-expanded': { minHeight: 48 },
                  '& .MuiAccordionSummary-content': {
                    margin: '8px 0',
                    '&.Mui-expanded': { margin: '8px 0' },
                  },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {section.icon}
                  <Typography variant="subtitle2" fontWeight={600}>
                    {section.title}
                  </Typography>
                  {section.badge !== undefined && (
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
                      {section.badge}
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  p: 1,
                  maxHeight: 'calc(100vh - 400px)',
                  overflow: 'auto',
                }}
              >
                {section.content}
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      )}
    </Box>
  );
}
