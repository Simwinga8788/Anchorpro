'use client';

import { createContext, useContext, useState } from 'react';

interface SidebarContextValue {
  mobileOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  mobileOpen: false,
  openSidebar: () => {},
  closeSidebar: () => {},
  toggleSidebar: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{
      mobileOpen,
      openSidebar:  () => setMobileOpen(true),
      closeSidebar: () => setMobileOpen(false),
      toggleSidebar: () => setMobileOpen(p => !p),
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
