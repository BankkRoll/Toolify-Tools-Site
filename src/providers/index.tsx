import { WalletContextProvider } from '@/providers/wallet-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AnalyticsProvider } from '@/providers/analytics-provider';
import { MotionProvider } from '@/providers/motion-provider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <WalletContextProvider>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
        <MotionProvider>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </MotionProvider>
      </ThemeProvider>
    </WalletContextProvider>
  );
};
