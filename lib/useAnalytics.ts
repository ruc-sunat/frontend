/**
 * Hook para rastrear eventos en Google Analytics
 * Uso: const analytics = useAnalytics();
 *      analytics.trackEvent('ruc_search', { ruc: '20612387654' });
 */

export function useAnalytics() {
  const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventData);
    }
  };

  const trackPageView = (pageName: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'G-QC7LS7PMR6', {
        'page_path': pageName,
      });
    }
  };

  return { trackEvent, trackPageView };
}
