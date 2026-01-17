import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import GroupsListPage from "./pages/groups/GroupsListPage";
import GroupDashboardPage from "./pages/groups/GroupDashboardPage";
import GroupLayout from "./layouts/GroupLayout";

import ExpensesPage from "./pages/expenses/ExpensesPage";
import BalancesPage from "./pages/balances/BalancesPage";
import SettlementPage from "./pages/settle/SettlementPage";

import VerifyFailedPage from "./pages/auth/VerifyFailedPage";
import VerifySuccessPage from "./pages/auth/VerifySuccessPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-success" element={<VerifySuccessPage />} />
          <Route path="/verify-failed" element={<VerifyFailedPage />} />


          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/groups" replace />} />
            <Route path="groups" element={<GroupsListPage />} />

            <Route path="groups/:groupId" element={<GroupLayout />}>
              <Route index element={<GroupDashboardPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              {/* <Route path="balances" element={<BalancesPage />} />  */}
              <Route path="settle" element={<SettlementPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/groups" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
