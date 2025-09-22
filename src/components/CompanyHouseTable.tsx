import React, { useState, useEffect, useRef } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { usePaginatedCompanyHouse } from '@/api/companyHouse';

export function CompanyHouseTable({ reference }: { reference: React.RefObject<HTMLDivElement> }) {
    const [page, setPage] = useState(1);
    const [searchCompany, setSearchCompany] = useState('');
    const [searchNumber, setSearchNumber] = useState('');
    const [searchPostcode, setSearchPostcode] = useState('');
    const [searchQuery, setSearchQuery] = useState({
        company: '',
        number: '',
        postcode: ''
    });
    const [cursor, setCursor] = useState<string | null>(null);
    const [useCursorPagination, setUseCursorPagination] = useState(false);
    const limit = 500;

    const queryParams = {
        page: useCursorPagination ? undefined : page,
        limit,
        searchCompany: searchQuery.company || undefined,
        searchNumber: searchQuery.number || undefined,
        searchPostcode: searchQuery.postcode || undefined,
        cursor: useCursorPagination ? cursor : undefined,
        useCursor: useCursorPagination ? 'true' : undefined,
    };

    // Debug logging
    console.log('Search Query:', searchQuery);
    console.log('API Params:', queryParams);

    const { data, isLoading, isFetching, error } = usePaginatedCompanyHouse(queryParams);

    // Debug API response
    console.log('API Response:', { data, isLoading, isFetching, error });

    // Scroll to top when page or cursor changes
    useEffect(() => {
        if (reference.current) {
            reference.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, [page, cursor, useCursorPagination]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Search initiated with:', { 
            company: searchCompany, 
            number: searchNumber, 
            postcode: searchPostcode 
        });
        setSearchQuery({
            company: searchCompany,
            number: searchNumber,
            postcode: searchPostcode
        });
        setPage(1);
        setCursor(null); // Reset cursor on new search
        setUseCursorPagination(false); // Use traditional pagination for searches
    };

    const handleNextPage = () => {
        if (useCursorPagination) {
            // Cursor-based pagination
            if (data?.pagination && 'nextCursor' in data.pagination && data.pagination.nextCursor) {
                setCursor(data.pagination.nextCursor);
            }
        } else {
            // Traditional pagination
            setPage(page + 1);
        }
    };

    const handlePreviousPage = () => {
        if (useCursorPagination) {
            // For cursor pagination, we can't go back easily
            // You might want to implement a cursor history stack
            setUseCursorPagination(false);
            setPage(1);
            setCursor(null);
        } else {
            setPage(page - 1);
        }
    };

    const handlePageJump = (targetPage: number) => {
        if (targetPage > 1000) {
            // For very deep pages, switch to cursor pagination
            setUseCursorPagination(true);
            setCursor(null);
            // Note: You can't jump to a specific page with cursor pagination
            // You'd need to implement a different approach for this
        } else {
            setUseCursorPagination(false);
            setPage(targetPage);
            setCursor(null);
        }
    };

    const renderPaginationInfo = () => {
        if (!data?.pagination) return null;

        if (useCursorPagination) {
            const hasMore = data.pagination.hasMore;
            return (
                <div className="text-sm text-muted-foreground">
                    Showing {data.data.length} results
                    {hasMore && (
                        <span> • More results available</span>
                    )}
                </div>
            );
        } else {
            // Traditional pagination - calculate total pages from hasMore and current results
            const { page: currentPage, total, hasMore } = data.pagination;
            const totalDisplay = total !== null ? `${total} total results` : 'results';
            return (
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} • {totalDisplay}
                    {hasMore && (
                        <span> • More results available</span>
                    )}
                </div>
            );
        }
    };

    const renderPaginationButtons = () => {
        if (!data?.pagination) return null;

        if (useCursorPagination) {
            // Simple next/previous for cursor pagination
            const hasMore = data.pagination.hasMore;
            return (
                <>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={handlePreviousPage}
                            className="cursor-pointer"
                        />
                    </PaginationItem>
                    <PaginationItem>
                        <span className="px-4 py-2 text-sm">
                            Cursor-based pagination
                        </span>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext
                            onClick={handleNextPage}
                            className={`cursor-pointer ${!hasMore ? 'opacity-50' : ''}`}
                        />
                    </PaginationItem>
                </>
            );
        } else {
            // Traditional pagination with simplified logic due to different pagination structure
            const { page: currentPage, hasMore } = data.pagination;
            const buttons = [];
            const maxVisiblePages = 5;

            // Previous button
            if (currentPage > 1) {
                buttons.push(
                    <PaginationItem key="prev">
                        <PaginationPrevious
                            onClick={handlePreviousPage}
                            className="cursor-pointer"
                        />
                    </PaginationItem>
                );
            }

            // Show some page numbers around current page
            const startPage = Math.max(1, currentPage - 2);
            const endPage = currentPage + 2;

            for (let i = startPage; i <= endPage; i++) {
                if (i === currentPage) {
                    buttons.push(
                        <PaginationItem key={i}>
                            <PaginationLink
                                isActive={true}
                                className="cursor-pointer"
                            >
                                {i}
                            </PaginationLink>
                        </PaginationItem>
                    );
                } else if (i < currentPage || (i > currentPage && hasMore)) {
                    buttons.push(
                        <PaginationItem key={i}>
                            <PaginationLink
                                onClick={() => handlePageJump(i)}
                                className="cursor-pointer"
                            >
                                {i}
                            </PaginationLink>
                        </PaginationItem>
                    );
                }
            }

            // Next button
            if (hasMore) {
                buttons.push(
                    <PaginationItem key="next">
                        <PaginationNext
                            onClick={handleNextPage}
                            className="cursor-pointer"
                        />
                    </PaginationItem>
                );
            }

            return buttons;
        }
    };

    const formatAddress = (regAddress: any) => {
        if (!regAddress) return 'N/A';
        const parts = [
            regAddress.AddressLine1,
            regAddress.AddressLine2,
            regAddress.PostTown,
            regAddress.PostCode
        ].filter(Boolean);
        return parts.join(', ') || 'N/A';
    };

    return (
        <div className="container mx-auto py-2">
            <div className="mb-6 flex flex-col gap-4">
                <h1 className="text-xl font-bold mb-3">Company House Import Data</h1>

                <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                    <Input
                        type="text"
                        placeholder="Search by company name..."
                        value={searchCompany}
                        onChange={(e) => setSearchCompany(e.target.value)}
                        className="w-full max-w-sm p-1"
                    />
                    <Input
                        type="text"
                        placeholder="Search by company number..."
                        value={searchNumber}
                        onChange={(e) => setSearchNumber(e.target.value)}
                        className="w-full max-w-sm p-1"
                    />
                    <Input
                        type="text"
                        placeholder="Search by postcode..."
                        value={searchPostcode}
                        onChange={(e) => setSearchPostcode(e.target.value)}
                        className="w-full max-w-sm p-1"
                    />
                    <Button size='sm' type="submit" disabled={isLoading}>Search</Button>
                </form>
            </div>

            <div className="rounded-md border relative">
                {(isLoading || isFetching) && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm">Loading...</span>
                        </div>
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">Company Name</TableHead>
                            <TableHead className="w-[15%]">Company Number</TableHead>
                            <TableHead className="w-[25%]">Address</TableHead>
                            <TableHead className="w-[15%]">Status</TableHead>
                            <TableHead className="w-[20%]">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-red-600">
                                    Error loading data: {error.message}
                                </TableCell>
                            </TableRow>
                        ) : !data?.data.length ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No data found</TableCell>
                            </TableRow>
                        ) : (
                            data.data.map((item) => (
                                <TableRow key={item._id}>
                                    <TableCell className="max-w-xs">
                                        <div className="font-medium truncate">
                                            {item.CompanyName}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className="font-mono text-sm">
                                            {item.CompanyNumber}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className="text-sm text-muted-foreground">
                                            {formatAddress(item.RegAddress)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className={`text-sm px-2 py-1 rounded-md inline-block ${
                                            item.CompanyStatus === 'Active' ? 'bg-green-100 text-green-800' :
                                            item.CompanyStatus === 'Dissolved' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {item.CompanyStatus || 'Unknown'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="grid grid-cols-1 gap-1 text-sm">
                                            {item.IncorporationDate && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Incorporated:</span>
                                                    <span className="text-muted-foreground">{item.IncorporationDate}</span>
                                                </div>
                                            )}
                                            {item.date && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Import Date:</span>
                                                    <span className="text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {item.is_blacklisted && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium text-red-600">Blacklisted:</span>
                                                    <span className="text-red-600">Yes</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {data?.pagination && (
                <div className="mt-4">
                    {renderPaginationInfo()}
                    <Pagination className="mt-2">
                        <PaginationContent>
                            {renderPaginationButtons()}
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}