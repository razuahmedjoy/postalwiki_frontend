import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, LayoutDashboard, Settings, Users, Menu, ShoppingCart, Upload, Database, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

interface SidebarGroupProps {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className={cn(
        'sidebar-item',
        isActive ? 'active' : ''
      )}
      onClick={onClick}
      end
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

const SidebarGroup: React.FC<SidebarGroupProps> = ({ icon, label, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const location = useLocation();

  // Auto-open group if any child route is active
  useEffect(() => {
    const childLinks = React.Children.toArray(children).filter(
      (child) => React.isValidElement(child) && child.props.to
    ) as React.ReactElement<SidebarItemProps>[];

    const hasActiveChild = childLinks.some(child => location.pathname === child.props.to);

    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [children, location.pathname]);

  return (
    <div className="py-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sidebar-item w-full flex justify-between"
      >
        <div className="flex items-center gap-3">
          {icon || <div className="h-2 w-2 rounded-full bg-current" />}
          <span>{label}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="ml-9 mt-1 flex flex-col gap-1">
          {children}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const isMobile = useIsMobile();
  const handleItemClick = () => {
    if (isMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={cn(
        'bg-sidebar fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-sidebar-border transition-transform duration-300 ease-in-out',
        isMobile && !isMobileOpen && '-translate-x-full',
        isMobile && isMobileOpen && 'translate-x-0',
        !isMobile && 'translate-x-0'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <h2 className="text-xl font-bold text-sidebar-foreground">Admin Panel</h2>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        <div className="flex flex-col gap-1">
          {/* <SidebarItem
            to="/dashboard"
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            onClick={handleItemClick}
          /> */}

          {/* <SidebarItem
            to="/dashboard/orders"
            icon={<ShoppingCart className="h-5 w-5" />}
            label="Orders"
            onClick={handleItemClick}
          /> */}

          <SidebarGroup
            icon={<Users className="h-5 w-5" />}
            label="Social Scrape"
            defaultOpen
          >
            <SidebarItem
              to="/dashboard/social-scrape-import"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Social Scrape Import"
              onClick={handleItemClick}
            />
            <SidebarItem
              to="/dashboard/social-scrape"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Social Scrape Data"
              onClick={handleItemClick}
            />
            <SidebarItem
              to="/dashboard/social-scrape/blacklist"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Blacklist Processing"
              onClick={handleItemClick}
            />
            <SidebarItem
              to="/dashboard/social-scrape/update-phone-number"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Update Phone Number"
              onClick={handleItemClick}
            />
            <SidebarItem
              to="/dashboard/social-scrape/match-adult-keywords"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Match Adult Keywords"
              onClick={handleItemClick}
            />
          </SidebarGroup>

          <SidebarGroup
            icon={<Building className="h-5 w-5" />}
            label="Company House"
            defaultOpen
          >
            <SidebarItem
              to="/dashboard/ch-import"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Import CH"
              onClick={handleItemClick}
            />
            <SidebarItem
              to="/dashboard/company-house"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Company House Data"
              onClick={handleItemClick}
            />
          </SidebarGroup>

          <SidebarGroup
            icon={<Database className="h-5 w-5" />}
            label="Address Master"
            defaultOpen
          >
            <SidebarItem
              to="/dashboard/address-master-import"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Import Address Master"
              onClick={handleItemClick}
            />
            <SidebarItem
              to="/dashboard/address-master"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Address Master Data"
              onClick={handleItemClick}
            />
          </SidebarGroup>

          <SidebarGroup
            label="Bostal DataBase"
            defaultOpen
          >
            <SidebarItem
              to="/dashboard/botsol/import"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Botsol Import"
              onClick={handleItemClick}
            />
            <SidebarItem
              to="/dashboard/botsol/list"
              icon={<div className="h-2 w-2 rounded-full bg-current" />}
              label="Botsol List"
              onClick={handleItemClick}
            />

          </SidebarGroup>
          <SidebarItem
            to="/dashboard/ss-url-import"
            icon={<Upload className="h-5 w-5" />}
            label="SS-URL Import"
            onClick={handleItemClick}
          />
          <SidebarItem
            to="/dashboard/mongodb-stats"
            icon={<Database className="h-5 w-5" />}
            label="Collection Stats"
            onClick={handleItemClick}
          />
          {/* <SidebarItem
            to="/dashboard/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            onClick={handleItemClick}
          /> */}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
