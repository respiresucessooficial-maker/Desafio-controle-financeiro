'use client';

import { AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/contexts/NotificationsContext';
import AlertBanner from './AlertBanner';

export default function AlertBannerList() {
  const { alerts, dismissAlert } = useNotifications();

  if (alerts.length === 0) return null;

  return (
    <div className="mb-2">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <AlertBanner
            key={alert.id}
            alert={alert}
            onDismiss={() => dismissAlert(alert.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
