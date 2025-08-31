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
import { usePaginatedBotsol } from '@/api/bostal';

export function BotsolListTable({ reference }: { reference: React.RefObject<HTMLDivElement> }) {
    const [page, setPage] = useState(1);
    const [searchUrl, setSearchUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [cursor, setCursor] = useState<string | null>(null);
    const [useCursorPagination, setUseCursorPagination] = useState(false);
    const limit = 500;



    const { data, isLoading, isFetching } = usePaginatedBotsol({
        page: useCursorPagination ? undefined : page,
        limit,
        searchUrl: searchQuery || undefined,
        cursor: useCursorPagination ? cursor : undefined,
        useCursor: useCursorPagination ? 'true' : undefined,
    });

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
        setSearchQuery(searchUrl);
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
            const hasNextPage = 'hasNextPage' in data.pagination ? data.pagination.hasNextPage : false;
            return (
                <div className="text-sm text-muted-foreground">
                    Showing {data.data.length} results
                    {hasNextPage && (
                        <span> • More results available</span>
                    )}
                </div>
            );
        } else {
            // Traditional pagination
            if ('page' in data.pagination && 'total' in data.pagination && 'totalPages' in data.pagination) {
                const { page: currentPage, total, totalPages } = data.pagination;
                return (
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} • {total} total results
                    </div>
                );
            }
            return null;
        }
    };

    const renderPaginationButtons = () => {
        if (!data?.pagination) return null;

        if (useCursorPagination) {
            // Simple next/previous for cursor pagination
            const hasNextPage = 'hasNextPage' in data.pagination ? data.pagination.hasNextPage : false;
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
                            className={`cursor-pointer ${!hasNextPage ? 'opacity-50' : ''}`}
                        />
                    </PaginationItem>
                </>
            );
        } else {
            // Traditional pagination
            if (!('page' in data.pagination && 'totalPages' in data.pagination)) {
                return null;
            }

            const { page: currentPage, totalPages } = data.pagination;
            const buttons = [];
            const maxVisiblePages = 5;

            // Always show first page
            buttons.push(
                <PaginationItem key="first">
                    <PaginationLink
                        onClick={() => handlePageJump(1)}
                        isActive={currentPage === 1}
                        className="cursor-pointer"
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );

            // Calculate start and end of visible pages
            let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
            const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

            // Adjust start page if we're near the end
            if (endPage === totalPages - 1) {
                startPage = Math.max(2, endPage - maxVisiblePages + 1);
            }

            // Add ellipsis after first page if needed
            if (startPage > 2) {
                buttons.push(
                    <PaginationItem key="ellipsis1">
                        <span className="px-4 py-2">...</span>
                    </PaginationItem>
                );
            }

            // Add middle pages
            for (let i = startPage; i <= endPage; i++) {
                buttons.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            onClick={() => handlePageJump(i)}
                            isActive={i === currentPage}
                            className="cursor-pointer"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            // Add ellipsis before last page if needed
            if (endPage < totalPages - 1) {
                buttons.push(
                    <PaginationItem key="ellipsis2">
                        <span className="px-4 py-2">...</span>
                    </PaginationItem>
                );
            }

            // Always show last page if there is more than one page
            if (totalPages > 1) {
                buttons.push(
                    <PaginationItem key="last">
                        <PaginationLink
                            onClick={() => handlePageJump(totalPages)}
                            isActive={currentPage === totalPages}
                            className="cursor-pointer"
                        >
                            {totalPages}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            return buttons;
        }
    };

    return (
        <div className="container mx-auto py-2">
            <div className="mb-6 flex justify-between w-full">
                <h1 className="text-xl font-bold mb-3">Social Media Scrape Data jho</h1>

                <form onSubmit={handleSearch} className="flex gap-4">
                    <Input
                        type="text"
                        placeholder="Search by URL..."
                        value={searchUrl}
                        onChange={(e) => setSearchUrl(e.target.value)}
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
                            <TableHead className="w-[25%]">URL</TableHead>
                            <TableHead className="w-[20%]">Date</TableHead>
                            <TableHead>Fields</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : !data?.data.length ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">No data found</TableCell>
                            </TableRow>
                        ) : (
                            data.data.map((item) => (
                                <TableRow key={item._id}>
                                    <TableCell className="max-w-xs truncate">
                                        <a
                                            href={`https://${item.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {item.url}
                                        </a>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">

                                        <div className="flex gap-1">
                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                        </div>

                                    </TableCell>
                                    <TableCell>
                                        <div className="grid grid-cols-1 gap-1 text-sm">
                                            {item.company_name && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Company Name </span>
                                                    <span className="text-muted-foreground">{item.company_name}</span>
                                                </div>
                                            )}
                                            {item.address && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Address</span>
                                                    <span className="text-muted-foreground">{item.address}</span>
                                                </div>
                                            )}
                                            
                                            {item.twitter && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Twitter</span>
                                                    <span className="text-muted-foreground">{item.twitter}</span>
                                                </div>
                                            )}
                                            {item.facebook && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Facebook</span>
                                                    <span className="text-muted-foreground">{item.facebook}</span>
                                                </div>
                                            )}
                                            {item.instagram && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Instagram</span>
                                                    <span className="text-muted-foreground">{item.instagram}</span>
                                                </div>
                                            )}
                                            {item.linkedin && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">LinkedIn</span>
                                                    <span className="text-muted-foreground">{item.linkedin}</span>
                                                </div>
                                            )}
                                            {item.youtube && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">YouTube</span>
                                                    <span className="text-muted-foreground">{item.youtube}</span>
                                                </div>
                                            )}
                             
                                            {item.email && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Email</span>
                                                    <span className="text-muted-foreground">{item.email}</span>
                                                </div>
                                            )}
                                            {item?.phone?.length > 0 && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Phone</span>
                                                    {item.phone.map((p) => (
                                                        <span key={p.number} className="text-muted-foreground">{p.number} - {p.areaName}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {item.postcode && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Postcode</span>
                                                    <span className="text-muted-foreground">{item.postcode}</span>
                                                </div>
                                            )}
                                            {item.statusCode && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Status</span>
                                                    <span className="text-muted-foreground">{item.statusCode}</span>
                                                </div>
                                            )}
                                            {item.redirect_url && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Redirect URL</span>
                                                    <span className="text-muted-foreground">{item.redirect_url}</span>
                                                </div>
                                            )}
                                            {item.meta_description && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Meta Description</span>
                                                    <span className="text-muted-foreground">{item.meta_description}</span>
                                                </div>
                                            )}
                                            {item.is_blacklisted && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Blacklisted</span>
                                                    <span className="text-muted-foreground">Yes</span>
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