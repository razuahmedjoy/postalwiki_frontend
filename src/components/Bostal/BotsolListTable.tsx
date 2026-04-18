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
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

    return (
        <div className="container mx-auto py-2 min-h-screen pb-24 relative">
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
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 min-w-[320px] z-50">
                    <div className="bg-background/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-full p-2 px-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={handlePreviousPage}
                            disabled={(data.pagination.page ?? 1) <= 1 || isLoading || isFetching}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <span className="text-sm font-medium whitespace-nowrap tabular-nums">
                            Page {(data.pagination.page ?? 1).toLocaleString()}
                            {'totalPages' in data.pagination ? ` of ${data.pagination.totalPages.toLocaleString()}` : ''}
                            <span className="ml-2 text-muted-foreground text-xs font-normal">
                                ({('total' in data.pagination ? (data.pagination.total ?? 0) : data.data.length).toLocaleString()} items)
                            </span>
                        </span>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={handleNextPage}
                            disabled={
                                (
                                    useCursorPagination
                                        ? !(data.pagination.hasNextPage ?? false)
                                        : !('totalPages' in data.pagination) || (data.pagination.page ?? 1) >= data.pagination.totalPages
                                )
                                || isLoading
                                || isFetching
                            }
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
} 