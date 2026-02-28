import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WaybillProvider } from "./contexts/WaybillContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WaybillList from "./pages/WaybillList";
import WaybillForm from "./pages/WaybillForm";
import WaybillDetail from "./pages/WaybillDetail";
import Transport from "./pages/Transport";
import Inventory from "./pages/Inventory";
import OrgManage from "./pages/OrgManage";
import RouteManage from "./pages/RouteManage";
import VehicleManage from "./pages/VehicleManage";
import CustomerManage from "./pages/CustomerManage";
import Finance from "./pages/Finance";
import UserManage from "./pages/UserManage";
import AlertCenter from "./pages/AlertCenter";
import OperationLogs from "./pages/OperationLogs";
import SignManage from "./pages/SignManage";
import ExceptionManage from "./pages/ExceptionManage";
import ReceiptManage from "./pages/ReceiptManage";
import Announcement from "./pages/Announcement";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/" />;
  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={Login} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/waybills" component={() => <ProtectedRoute component={WaybillList} />} />
      <Route path="/waybills/create" component={() => <ProtectedRoute component={WaybillForm} />} />
      <Route path="/waybills/:id/edit" component={() => <ProtectedRoute component={WaybillForm} />} />
      <Route path="/waybills/:id" component={() => <ProtectedRoute component={WaybillDetail} />} />
      <Route path="/transport" component={() => <ProtectedRoute component={Transport} />} />
      <Route path="/inventory" component={() => <ProtectedRoute component={Inventory} />} />
      <Route path="/org" component={() => <ProtectedRoute component={OrgManage} />} />
      <Route path="/routes" component={() => <ProtectedRoute component={RouteManage} />} />
      <Route path="/vehicles" component={() => <ProtectedRoute component={VehicleManage} />} />
      <Route path="/customers" component={() => <ProtectedRoute component={CustomerManage} />} />
      <Route path="/sign" component={() => <ProtectedRoute component={SignManage} />} />
      <Route path="/exception" component={() => <ProtectedRoute component={ExceptionManage} />} />
      <Route path="/receipt" component={() => <ProtectedRoute component={ReceiptManage} />} />
      <Route path="/finance" component={() => <ProtectedRoute component={Finance} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UserManage} />} />
      <Route path="/alerts" component={() => <ProtectedRoute component={AlertCenter} />} />
      <Route path="/logs" component={() => <ProtectedRoute component={OperationLogs} />} />
      <Route path="/announcement" component={() => <ProtectedRoute component={Announcement} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <WaybillProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WaybillProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
