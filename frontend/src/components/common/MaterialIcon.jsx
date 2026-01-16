import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Tooltip } from '@mui/material';
import { getIconUrl } from '../../services/iconService';

/**
 * MaterialIcon Component
 *
 * Displays a material icon with automatic fallback handling.
 * Can be used standalone or as an icon prop for MUI Chip components.
 *
 * Icon Specifications:
 * - Source: /assets/icons/{materialId}.png
 * - Size: 32x32 base (configurable via size prop)
 * - Style: Isometric mini-sprites with transparency
 */

// Category-based fallback colors for materials without icons
const CATEGORY_COLORS = {
  raw: '#8B4513',      // Brown for raw materials
  intermediate: '#4A90D9', // Blue for intermediate parts
  final: '#2E7D32',    // Green for final goods
  equipment: '#9C27B0', // Purple for equipment
  default: '#757575',  // Gray default
};

// Generate a simple colored placeholder based on material ID
function generatePlaceholder(materialId, category, size) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  const letter = (materialId || '?')[0].toUpperCase();

  return (
    <Box
      sx={{
        width: size,
        height: size,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        fontWeight: 'bold',
        color: 'white',
        borderRadius: '2px',
        textShadow: '1px 1px 1px rgba(0,0,0,0.3)',
        // Isometric-ish shape using clip-path
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
      }}
    >
      {letter}
    </Box>
  );
}

export default function MaterialIcon({
  materialId,
  materialName,
  category = 'default',
  size = 24,
  showTooltip = false,
  quantity,
  sx = {},
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const iconUrl = getIconUrl(materialId);

  // Build tooltip content
  const tooltipContent = materialName || materialId;
  const tooltipWithQuantity = quantity !== undefined
    ? `${tooltipContent}: ${quantity}`
    : tooltipContent;

  const iconElement = (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        ...sx,
      }}
    >
      {!hasError ? (
        <img
          src={iconUrl}
          alt={materialName || materialId}
          width={size}
          height={size}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            objectFit: 'contain',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.15s ease-in-out',
          }}
        />
      ) : null}

      {/* Show placeholder while loading or on error */}
      {(hasError || isLoading) && (
        <Box
          sx={{
            position: hasError ? 'relative' : 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {generatePlaceholder(materialId, category, size)}
        </Box>
      )}
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip title={tooltipWithQuantity} arrow placement="top">
        {iconElement}
      </Tooltip>
    );
  }

  return iconElement;
}

MaterialIcon.propTypes = {
  /** The material ID (used to construct icon path) */
  materialId: PropTypes.string.isRequired,
  /** Display name for the material (used in tooltip/alt) */
  materialName: PropTypes.string,
  /** Material category for fallback color */
  category: PropTypes.oneOf(['raw', 'intermediate', 'final', 'equipment', 'default']),
  /** Icon size in pixels */
  size: PropTypes.number,
  /** Whether to show a tooltip on hover */
  showTooltip: PropTypes.bool,
  /** Optional quantity to display in tooltip */
  quantity: PropTypes.number,
  /** Additional MUI sx styles */
  sx: PropTypes.object,
};

/**
 * Hook for using MaterialIcon as a MUI Chip icon
 * Returns props compatible with Chip's icon prop
 */
export function useMaterialChipIcon(materialId, materialName, category, size = 20) {
  return (
    <MaterialIcon
      materialId={materialId}
      materialName={materialName}
      category={category}
      size={size}
      sx={{ marginLeft: '4px' }}
    />
  );
}
