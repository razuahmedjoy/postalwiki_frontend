import React, { useRef } from 'react';
import { AddressMasterTable } from '@/components/AddressMasterTable';

const SearchAddressMaster = () => {
    const tableRef = useRef<HTMLDivElement>(null);

    return (
        <div className="container mx-auto p-5">
            <div ref={tableRef}>
                <AddressMasterTable reference={tableRef} />
            </div>
        </div>
    );
};

export default SearchAddressMaster;