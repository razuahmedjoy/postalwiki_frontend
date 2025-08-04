import { BotsolListTable } from '@/components/Bostal/BotsolListTable';
import React, { useRef } from 'react';

const BotsolList = () => {
    const containerRef = useRef < HTMLDivElement > (null);

    return (
        <div className="p-4 mx-auto bg-background shadow-md" ref={containerRef}>

            <BotsolListTable reference={containerRef} />
        </div>
    );
};

export default BotsolList;