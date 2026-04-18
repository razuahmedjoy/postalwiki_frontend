import { useRef } from 'react';
import { RMAddressTable } from '@/components/RMAddress/RMAddressTable';

const RMAddressView = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="p-4 mx-auto bg-background shadow-md" ref={containerRef}>
      <RMAddressTable reference={containerRef} />
    </div>
  );
};

export default RMAddressView;
