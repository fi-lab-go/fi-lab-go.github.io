import { createContext, useContext } from "react";
import { Outlet } from "@tanstack/react-router";
import AppHeader from "@/components/lab/AppHeader";
import FullLoader from "@/components/lab/FullLoader";
import { useLabSession } from "@/lib/useLabSession";

const LabUserContext = createContext(null);

export function useLabUser() {
  return useContext(LabUserContext);
}

export default function LabShell({ role }) {
  const { loading, user, token } = useLabSession(role);

  if (loading || !user) return <FullLoader label="Verificando tu sesión" />;

  return (
    <LabUserContext.Provider value={{ user, token, role }}>
      <div className="min-h-screen bg-background">
        <AppHeader user={user} role={role} token={token} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </LabUserContext.Provider>
  );
}