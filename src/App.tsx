import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from '@/providers/QueryProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthInitializer } from '@/components/AuthInitializer';

// Pages
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Users from "./pages/dashboard/Users";
import UserForm from "./pages/dashboard/UserForm";
import Settings from "./pages/dashboard/Settings";
import Orders from "./pages/dashboard/Orders";
import NotFound from "./pages/NotFound";
import SSUrlImport from "./pages/dashboard/SSUrlImport";
import Login from "./pages/auth/Login";
import MongoDBStats from "./pages/dashboard/MongoDBStats";
import SocialScrapeImport from "./pages/dashboard/SocialScrape/SocialScrapeImport";
import { SocialScrapePage } from "./pages/dashboard/SocialScrape/SocialScrapePage";

import BlacklistProcessPage from "./pages/dashboard/SocialScrape/BlacklistProcessPage";
import UpdatePhoneNumberPage from "./pages/dashboard/SocialScrape/UpdatePhoneNumber";
import BostalImport from "./pages/dashboard/Bostal/BostalImport";
import BotsolList from "./pages/dashboard/Bostal/BotsolList";
import MatchAdultKeywordsPage from "./pages/dashboard/SocialScrape/MatchAdultKeywordsPage";
const App = () => (
  <QueryProvider>
    <ThemeProvider>
      <TooltipProvider>
        <AuthInitializer />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="users/new" element={<UserForm />} />
              <Route path="orders" element={<Orders />} />
              <Route path="settings" element={<Settings />} />

              <Route path="ss-url-import" element={<SSUrlImport />} />
              <Route path="mongodb-stats" element={<MongoDBStats />} />

              {/* social scrape */}
              <Route path="social-scrape-import" element={<SocialScrapeImport />} />
              <Route path="social-scrape" element={<SocialScrapePage />} />
              <Route path="social-scrape/blacklist" element={<BlacklistProcessPage />} />
              <Route path="social-scrape/update-phone-number" element={<UpdatePhoneNumberPage />} />
              <Route path="social-scrape/match-adult-keywords" element={<MatchAdultKeywordsPage />} />


              <Route path="botsol">
                <Route path="import" element={<BostalImport />} />
                <Route path="list" element={<BotsolList />} />
              </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryProvider>
);

export default App;
