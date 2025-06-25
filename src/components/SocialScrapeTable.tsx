import React, { useState } from 'react';
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
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { usePaginatedSocialScrapes } from '@/api/socialScrape';

export function SocialScrapeTable() {
    const [page, setPage] = useState(1);
    const [searchUrl, setSearchUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const limit = 500;

    const { data, isLoading, isFetching } = usePaginatedSocialScrapes({
        page,
        limit,
        searchUrl: searchQuery || undefined,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchUrl); // Only update the search query when button is clicked
        setPage(1); // Reset to first page on new search
    };

    const renderPaginationButtons = () => {
        if (!data?.pagination) return null;

        const { page: currentPage, totalPages } = data.pagination;
        const buttons = [];
        const maxVisiblePages = 3;

        // Always show first page
        buttons.push(
            <PaginationItem key="first">
                <PaginationLink
                    onClick={() => setPage(1)}
                    isActive={currentPage === 1}
                    className="cursor-pointer"
                >
                    1
                </PaginationLink>
            </PaginationItem>
        );

        // Calculate start and end of visible pages
        let startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

        // Adjust start page if we're near the end
        if (endPage === totalPages - 1) {
            startPage = Math.max(2, endPage - maxVisiblePages + 1);
        }

        // Add ellipsis after first page if needed
        if (startPage > 2) {
            buttons.push(
                <PaginationItem key="ellipsis1">
                    <PaginationEllipsis className="cursor-pointer" />
                </PaginationItem>
            );
        }

        // Add middle pages
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        onClick={() => setPage(i)}
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
                    <PaginationEllipsis className="cursor-pointer" />
                </PaginationItem>
            );
        }

        // Always show last page if there is more than one page
        if (totalPages > 1) {
            buttons.push(
                <PaginationItem key="last">
                    <PaginationLink
                        onClick={() => setPage(totalPages)}
                        isActive={currentPage === totalPages}
                        className="cursor-pointer"
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return buttons;
    };

    return (
        <div className="container mx-auto py-2">
            <div className="mb-6 flex justify-between w-full">
                <h1 className="text-xl font-bold mb-3">Social Media Scrape Data</h1>

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
                                <TableCell colSpan={2} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : !data?.data.length ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">No data found</TableCell>
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
                                        {item.date && (
                                            <div className="flex gap-1">
                                 
                                                <span>{new Date(item.date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="grid grid-cols-1 gap-1 text-sm">
                                    
                                            {item.title && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Title </span>
                                                    <span className="text-muted-foreground">{item.title}</span>
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
                                            {item.pinterest && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Pinterest</span>
                                                    <span className="text-muted-foreground">{item.pinterest}</span>
                                                </div>
                                            )}
                                            {item.email && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Email</span>
                                                    <span className="text-muted-foreground">{item.email}</span>
                                                </div>
                                            )}
                                            {item.phone && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Phone</span>
                                                    <span className="text-muted-foreground">
                                                        {item.phone.join(', ')}
                                                    </span>
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

                                            {item.keywords && (
                                                <div className="flex gap-1">
                                                    <span className="text-sm font-medium">Keywords</span>
                                                    <span className="text-muted-foreground">{item.keywords}</span>
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
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => page > 1 && setPage(page - 1)}
                                    className={`cursor-pointer ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
                                />
                            </PaginationItem>
                            {renderPaginationButtons()}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => page < data.pagination.totalPages && setPage(page + 1)}
                                    className={`cursor-pointer ${page === data.pagination.totalPages ? ' opacity-50 ' : ''}`}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
} 