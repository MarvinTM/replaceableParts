import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import MaterialIcon from './MaterialIcon';
import { getMaterialName } from '../../utils/translationHelpers';

export default function StructureSpriteIcon({
  structureId,
  materialId,
  materialName,
  category,
  size = 40,
}) {
  const spriteSources = useMemo(() => {
    if (!structureId) return [];
    return [
      `/assets/factory/${structureId}_idle.png`,
      `/assets/factory/${structureId}.png`,
      `/assets/factory/${structureId}_anim_1.png`,
    ];
  }, [structureId]);

  const [spriteIndex, setSpriteIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setSpriteIndex(0);
    setHasError(false);
  }, [structureId]);

  const handleError = () => {
    const nextIndex = spriteIndex + 1;
    if (nextIndex < spriteSources.length) {
      setSpriteIndex(nextIndex);
      return;
    }
    setHasError(true);
  };

  if (hasError || spriteSources.length === 0) {
    return (
      <MaterialIcon
        materialId={materialId}
        materialName={materialName}
        category={category}
        size={size}
      />
    );
  }

  return (
    <Box
      component="img"
      src={spriteSources[spriteIndex]}
      alt={getMaterialName(materialId, materialName)}
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        imageRendering: 'pixelated',
      }}
      onError={handleError}
    />
  );
}
