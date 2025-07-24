// Telegram Web App integration
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat?: {
      id: number;
      type: string;
      title?: string;
      username?: string;
    };
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }, callback?: (buttonId: string) => void): void;
  sendData(data: string): void;
  switchInlineQuery(query: string, choose_chat_types?: string[]): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  openInvoice(url: string, callback?: (status: string) => void): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export class TelegramWebAppService {
  private webapp: TelegramWebApp | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webapp = window.Telegram.WebApp;
      this.webapp.ready();
      this.webapp.expand();
      this.isInitialized = true;

      console.log('Telegram WebApp initialized:', {
        platform: this.webapp.platform,
        version: this.webapp.version,
        user: this.webapp.initDataUnsafe.user
      });
    }
  }

  public isAvailable(): boolean {
    return this.isInitialized && this.webapp !== null;
  }

  public getUser() {
    return this.webapp?.initDataUnsafe.user || null;
  }

  public getInitData(): string {
    return this.webapp?.initData || '';
  }

  public getTheme() {
    return {
      colorScheme: this.webapp?.colorScheme || 'dark',
      themeParams: this.webapp?.themeParams || {}
    };
  }

  public setMainButton(text: string, onClick: () => void): void {
    if (!this.webapp) return;

    this.webapp.MainButton.setText(text);
    this.webapp.MainButton.onClick(onClick);
    this.webapp.MainButton.show();
  }

  public hideMainButton(): void {
    if (!this.webapp) return;
    this.webapp.MainButton.hide();
  }

  public enableMainButton(): void {
    if (!this.webapp) return;
    this.webapp.MainButton.enable();
  }

  public disableMainButton(): void {
    if (!this.webapp) return;
    this.webapp.MainButton.disable();
  }

  public showProgress(): void {
    if (!this.webapp) return;
    this.webapp.MainButton.showProgress();
  }

  public hideProgress(): void {
    if (!this.webapp) return;
    this.webapp.MainButton.hideProgress();
  }

  public hapticFeedback(type: 'success' | 'error' | 'warning' | 'impact'): void {
    if (!this.webapp) return;

    if (type === 'impact') {
      this.webapp.HapticFeedback.impactOccurred('medium');
    } else {
      this.webapp.HapticFeedback.notificationOccurred(type);
    }
  }

  public showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.webapp) {
        alert(message);
        resolve();
        return;
      }

      this.webapp.showAlert(message, () => resolve());
    });
  }

  public showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.webapp) {
        resolve(confirm(message));
        return;
      }

      this.webapp.showConfirm(message, (confirmed) => resolve(confirmed));
    });
  }

  public close(): void {
    if (!this.webapp) return;
    this.webapp.close();
  }

  public sendGameData(data: any): void {
    if (!this.webapp) return;
    
    this.webapp.sendData(JSON.stringify({
      type: 'game_result',
      data
    }));
  }

  public openInvoice(url: string): Promise<string> {
    return new Promise((resolve) => {
      if (!this.webapp) {
        window.open(url, '_blank');
        resolve('unknown');
        return;
      }

      this.webapp.openInvoice(url, (status) => resolve(status));
    });
  }
}

// Create singleton instance
export const telegramWebApp = new TelegramWebAppService();

// Auto-configure theme if in Telegram
if (telegramWebApp.isAvailable()) {
  const theme = telegramWebApp.getTheme();
  
  // Apply Telegram theme to CSS variables
  const root = document.documentElement;
  if (theme.themeParams.bg_color) {
    root.style.setProperty('--background', theme.themeParams.bg_color);
  }
  if (theme.themeParams.text_color) {
    root.style.setProperty('--foreground', theme.themeParams.text_color);
  }
  if (theme.themeParams.button_color) {
    root.style.setProperty('--primary', theme.themeParams.button_color);
  }
}
