import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Buses from "@/pages/Buses";
import RoutesPage from "@/pages/Routes";
import Trips from "@/pages/Trips";
import Scans from "@/pages/Scans";
import SmsPage from "@/pages/Sms";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/buses" component={Buses} />
        <Route path="/routes" component={RoutesPage} />
        <Route path="/trips" component={Trips} />
        <Route path="/scans" component={Scans} />
        <Route path="/sms" component={SmsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
