import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Devices from "@/pages/Devices";
import SmsPage from "@/pages/Sms";
import ScanPage from "@/pages/Scan";
import AttendancePage from "@/pages/Attendance";
import BusesPage from "@/pages/Buses";
import GpsMap from "@/pages/GpsMap";
import Login from "@/pages/Login";

const queryClient = new QueryClient();

function Router({ onLogout }: { onLogout: () => void }) {
  return (
    <AppLayout onLogout={onLogout}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/attendance" component={AttendancePage} />
        <Route path="/buses" component={BusesPage} />
        <Route path="/gps" component={GpsMap} />
        <Route path="/devices" component={Devices} />
        <Route path="/sms" component={SmsPage} />
        <Route path="/scan" component={ScanPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("saferide_auth") === "true");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {authed
            ? <Router onLogout={() => { localStorage.removeItem("saferide_auth"); setAuthed(false); }} />
            : <Login onLogin={() => setAuthed(true)} />
          }
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
