import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import useGameStore from '../../stores/gameStore';
import MaterialIcon from '../common/MaterialIcon';

export default function DonateSection() {
  const { t } = useTranslation();
  const engineState = useGameStore((state) => state.engineState);
  const rules = useGameStore((state) => state.rules);
  const donateCredits = useGameStore((state) => state.donateCredits);
  const donateParts = useGameStore((state) => state.donateParts);

  const [tabValue, setTabValue] = useState(0);
  const [creditAmount, setCreditAmount] = useState('1000');
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);

  const { credits, inventory } = engineState;
  const creditsToRPRatio = rules.research.creditsToRPRatio;
  const ageMultipliers = rules.research.ageMultipliers;

  // Get donable items (non-raw materials in inventory)
  const donableItems = useMemo(() => {
    return Object.entries(inventory || {})
      .map(([itemId, quantity]) => {
        const material = rules.materials.find(m => m.id === itemId);
        if (!material || material.category === 'raw') return null;
        const ageMultiplier = ageMultipliers[material.age] || 1.0;
        const rpPerUnit = Math.floor(material.basePrice * ageMultiplier);
        return { itemId, quantity, material, rpPerUnit };
      })
      .filter(Boolean)
      .sort((a, b) => b.rpPerUnit - a.rpPerUnit);
  }, [inventory, rules]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDonateCredits = () => {
    const amount = parseInt(creditAmount) || 0;
    if (amount > 0) {
      donateCredits(amount);
    }
  };

  const handleDonateParts = () => {
    if (selectedItem && itemQuantity > 0) {
      donateParts(selectedItem.itemId, itemQuantity);
      setSelectedItem(null);
      setItemQuantity(1);
    }
  };

  const creditRpGain = Math.floor((parseInt(creditAmount) || 0) / creditsToRPRatio);
  const partRpGain = selectedItem ? selectedItem.rpPerUnit * itemQuantity : 0;

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab icon={<AttachMoneyIcon />} label={t('research.donateCredits')} iconPosition="start" />
        <Tab icon={<InventoryIcon />} label={t('research.donateParts')} iconPosition="start" />
      </Tabs>

      {/* Credits Tab */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('research.convertCreditsDesc', { ratio: creditsToRPRatio })}
          </Typography>

          <TextField
            label={t('research.amount')}
            type="number"
            fullWidth
            size="small"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            inputProps={{ min: creditsToRPRatio }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2">{t('research.youHave')}: {credits?.toLocaleString() || 0} {t('research.credits')}</Typography>
            <Chip
              label={`+${creditRpGain} RP`}
              color={creditRpGain > 0 ? 'primary' : 'default'}
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {[100, 1000, 10000].map(preset => (
              <Button
                key={preset}
                variant="outlined"
                size="small"
                onClick={() => setCreditAmount(String(preset))}
              >
                {preset.toLocaleString()}
              </Button>
            ))}
          </Box>

          <Button
            variant="contained"
            fullWidth
            startIcon={<AddIcon />}
            disabled={creditRpGain <= 0 || (parseInt(creditAmount) || 0) > credits}
            onClick={handleDonateCredits}
          >
            {t('research.donateCreditsButton', { amount: (parseInt(creditAmount) || 0).toLocaleString() })}
          </Button>
        </Box>
      )}

      {/* Parts Tab */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('research.donatePartsDesc')}
          </Typography>

          {donableItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('research.noDonableItems')}
            </Typography>
          ) : (
            <>
              <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                {donableItems.map(item => (
                  <Box
                    key={item.itemId}
                    onClick={() => {
                      setSelectedItem(item);
                      setItemQuantity(1);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: selectedItem?.itemId === item.itemId ? 'primary.main' : 'divider',
                      bgcolor: selectedItem?.itemId === item.itemId ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                      mb: 0.5
                    }}
                  >
                    <MaterialIcon materialId={item.itemId} size={24} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{item.material.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        x{item.quantity} | {t('market.age')} {item.material.age}
                      </Typography>
                    </Box>
                    <Chip label={`${item.rpPerUnit} RP/ea`} size="small" color="primary" variant="outlined" />
                  </Box>
                ))}
              </Box>

              {selectedItem && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MaterialIcon materialId={selectedItem.itemId} size={32} />
                    <Typography variant="body1" fontWeight="bold">
                      {selectedItem.material.name}
                    </Typography>
                  </Box>

                  <TextField
                    label={t('research.quantity')}
                    type="number"
                    fullWidth
                    size="small"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1)))}
                    inputProps={{ min: 1, max: selectedItem.quantity }}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2">
                      {t('research.available')}: {selectedItem.quantity}
                    </Typography>
                    <Chip label={`+${partRpGain} RP`} color="primary" size="small" />
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    disabled={itemQuantity > selectedItem.quantity}
                    onClick={handleDonateParts}
                  >
                    {t('research.donatePartsButton', { quantity: itemQuantity, name: selectedItem.material.name })}
                  </Button>
                </>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
