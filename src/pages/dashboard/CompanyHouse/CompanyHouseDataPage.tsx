import { useRef } from 'react';
import { CompanyHouseTable } from '@/components/CompanyHouseTable';

export function CompanyHouseDataPage() {
  // Ref for the container to scroll to top
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="p-4 mx-auto bg-background shadow-md" ref={containerRef}>
      <CompanyHouseTable reference={containerRef} />
    </div>
  );
}