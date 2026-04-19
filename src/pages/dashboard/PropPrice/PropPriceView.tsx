import { useRef } from 'react';
import { PropPriceTable } from '@/components/PropPrice/PropPriceTable';

const PropPriceView = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="p-4 mx-auto bg-background shadow-md" ref={containerRef}>
      <PropPriceTable reference={containerRef} />
    </div>
  );
};

export default PropPriceView;
