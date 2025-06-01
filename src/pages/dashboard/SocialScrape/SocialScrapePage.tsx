import React from 'react';
import { SocialScrapeTable } from '@/components/SocialScrapeTable';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

export function SocialScrapePage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 mx-auto bg-background shadow-md">
     
      <SocialScrapeTable />
    </div>
  );
} 