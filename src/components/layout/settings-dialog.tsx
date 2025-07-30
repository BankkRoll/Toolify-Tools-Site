'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCompactMode, useSettingsStore } from '@/stores/settings-store';
import {
  Database,
  Download,
  Monitor,
  Moon,
  Palette,
  Settings,
  Shield,
  Sun,
  Trash2,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeSwitcher } from '../ui/theme-switch';

interface SettingsDialogProps {
  trigger?: React.ReactNode;
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const compactMode = useCompactMode();
  const {
    compactMode: storeCompactMode,
    animations,
    analytics,
    saveSearchHistory,
    updateSetting,
    resetSettings,
    clearAllData,
    exportData,
    getStorageStats,
  } = useSettingsStore();

  const [storageStats, setStorageStats] = useState(getStorageStats());

  // Update storage stats when dialog opens
  useEffect(() => {
    setStorageStats(getStorageStats());
  }, [getStorageStats]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='ghost' size='icon'>
            <Settings className='h-4 w-4' />
            <span className='sr-only'>Settings</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn('max-h-[90vh] overflow-y-auto', compactMode ? 'max-w-sm' : 'max-w-md')}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            Settings
          </DialogTitle>
          <DialogDescription>Customize your Toolify experience and preferences.</DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Appearance */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Palette className='h-4 w-4 text-muted-foreground' />
              <Label className='text-sm font-medium'>Appearance</Label>
            </div>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='theme' className='text-sm'>
                  Theme
                </Label>
                <ThemeSwitcher />
              </div>

              <div className='flex items-center justify-between'>
                <Label htmlFor='compact-mode' className='text-sm'>
                  Compact Mode
                </Label>
                <Switch
                  id='compact-mode'
                  checked={storeCompactMode}
                  onCheckedChange={checked => updateSetting('compactMode', checked)}
                />
              </div>

              <div className='flex items-center justify-between'>
                <Label htmlFor='animations' className='text-sm'>
                  Animations
                </Label>
                <Switch
                  id='animations'
                  checked={animations}
                  onCheckedChange={checked => updateSetting('animations', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Privacy & Data */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Shield className='h-4 w-4 text-muted-foreground' />
              <Label className='text-sm font-medium'>Privacy & Data</Label>
            </div>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Label htmlFor='analytics' className='text-sm'>
                    Analytics
                  </Label>
                </div>
                <Switch
                  id='analytics'
                  checked={analytics}
                  onCheckedChange={checked => updateSetting('analytics', checked)}
                />
              </div>

              <div className='flex items-center justify-between'>
                <Label htmlFor='save-search' className='text-sm'>
                  Save Search History
                </Label>
                <Switch
                  id='save-search'
                  checked={saveSearchHistory}
                  onCheckedChange={checked => updateSetting('saveSearchHistory', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className='flex gap-2'>
            <Button variant='outline' className='flex-1' onClick={exportData}>
              <Download className='mr-2 h-4 w-4' />
              Export Data
            </Button>
            <Button variant='outline' className='flex-1' onClick={resetSettings}>
              <Zap className='mr-2 h-4 w-4' />
              Reset Settings
            </Button>
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' className='flex-1' onClick={clearAllData}>
              <Trash2 className='mr-2 h-4 w-4' />
              Clear All Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
