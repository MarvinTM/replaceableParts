import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import BuildIcon from '@mui/icons-material/Build';

const categoryColors = {
  raw: { bg: '#dcfce7', border: '#16a34a', text: '#166534' },
  intermediate: { bg: '#dbeafe', border: '#2563eb', text: '#1e40af' },
  final: { bg: '#ffedd5', border: '#ea580c', text: '#9a3412' },
  equipment: { bg: '#f3e8ff', border: '#9333ea', text: '#6b21a8' },
  unknown: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' },
};

const issueStyles = {
  unused: { borderColor: '#9ca3af', opacity: 0.6 },
  unproduceable: { borderColor: '#dc2626', borderStyle: 'dashed' },
  noMachine: { borderColor: '#eab308', borderWidth: 3 },
  missing: { borderColor: '#dc2626', borderWidth: 3 },
};

function MaterialNode({ data, selected }) {
  const { label, category, isExtractable, issues = [], tier } = data;
  const colors = categoryColors[category] || categoryColors.unknown;

  // Determine border style based on issues
  let borderStyle = `2px solid ${colors.border}`;
  let opacity = 1;

  if (issues.length > 0) {
    const primaryIssue = issues[0];
    const style = issueStyles[primaryIssue.type];
    if (style) {
      if (style.borderColor) {
        borderStyle = `${style.borderWidth || 2}px ${style.borderStyle || 'solid'} ${style.borderColor}`;
      }
      if (style.opacity) {
        opacity = style.opacity;
      }
    }
  }

  return (
    <Box
      sx={{
        padding: '8px 12px',
        borderRadius: '8px',
        background: colors.bg,
        border: borderStyle,
        opacity,
        minWidth: 120,
        boxShadow: selected ? '0 0 0 3px #3b82f6' : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.2s, opacity 0.2s',
        cursor: 'pointer',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: colors.border }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isExtractable && (
          <Tooltip title="Extractable from map">
            <BuildIcon sx={{ fontSize: 14, color: colors.text }} />
          </Tooltip>
        )}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: colors.text,
            fontSize: '0.85rem',
          }}
        >
          {label}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        <Chip
          label={category}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.65rem',
            backgroundColor: 'rgba(0,0,0,0.08)',
            color: colors.text,
          }}
        />
        {tier !== undefined && (
          <Chip
            label={`T${tier}`}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              backgroundColor: 'rgba(0,0,0,0.08)',
              color: colors.text,
            }}
          />
        )}
      </Box>

      {issues.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
          {issues.map((issue, idx) => (
            <Tooltip key={idx} title={issue.message}>
              {issue.type === 'missing' || issue.type === 'unproduceable' ? (
                <ErrorIcon sx={{ fontSize: 16, color: '#dc2626' }} />
              ) : (
                <WarningIcon sx={{ fontSize: 16, color: '#eab308' }} />
              )}
            </Tooltip>
          ))}
        </Box>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: colors.border }}
      />
    </Box>
  );
}

export default memo(MaterialNode);
