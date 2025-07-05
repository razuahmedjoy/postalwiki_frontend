import { useRef } from 'react';
import { SocialScrapeTable } from '@/components/SocialScrapeTable';

export function SocialScrapePage() {
  // Ref for the container to scroll to top
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="p-4 mx-auto bg-background shadow-md" ref={containerRef}>

      <SocialScrapeTable reference={containerRef} />
    </div>
  );
} 