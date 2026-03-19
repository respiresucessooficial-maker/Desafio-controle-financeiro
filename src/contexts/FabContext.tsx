'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface FabConfig {
  onClick: () => void;
  label: string;
  hidden?: boolean;
}

interface FabContextValue {
  config: FabConfig;
  setConfig: (c: FabConfig) => void;
  clearConfig: () => void;
}

const DEFAULT_CONFIG: FabConfig = {
  onClick: () => {},
  label: 'Nova transação',
  hidden: true,
};

const FabContext = createContext<FabContextValue>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
  clearConfig: () => {},
});

export function FabProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<FabConfig>(DEFAULT_CONFIG);

  const setConfig = useCallback((c: FabConfig) => {
    setConfigState(c);
  }, []);

  const clearConfig = useCallback(() => {
    setConfigState(DEFAULT_CONFIG);
  }, []);

  return (
    <FabContext.Provider value={{ config, setConfig, clearConfig }}>
      {children}
    </FabContext.Provider>
  );
}

export const useFab = () => useContext(FabContext);

export function useFabAction(config: FabConfig) {
  const { setConfig, clearConfig } = useFab();

  useEffect(() => {
    setConfig(config);
    return () => clearConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
