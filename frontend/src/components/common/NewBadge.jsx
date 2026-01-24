import { useTranslation } from 'react-i18next';
import Chip from '@mui/material/Chip';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

/**
 * A small "NEW" indicator badge with a subtle pulse animation.
 */
export default function NewBadge({ size = 'small' }) {
  const { t } = useTranslation();

  return (
    <Chip
      label={t('common.new')}
      size={size}
      color="error"
      sx={{
        height: size === 'small' ? 18 : 24,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        fontWeight: 600,
        animation: `${pulse} 2s ease-in-out infinite`,
        '& .MuiChip-label': {
          px: size === 'small' ? 0.75 : 1,
        },
      }}
    />
  );
}
