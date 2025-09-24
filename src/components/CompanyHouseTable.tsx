import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Building2, MapPin, Calendar, Hash, Globe, Trash2 } from "lucide-react";
import { usePaginatedCompanyHouse, useDeleteAllCompanyHouseData } from '@/api/companyHouse';
import { useToast } from '@/hooks/use-toast';

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
    const [isMobile, setIsMobile] = useState(false);
    const limit = 500;

    // Check for mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Memoize query parameters to prevent unnecessary re-renders
    const queryParams = useMemo(() => ({
        page: useCursorPagination ? undefined : page,
        limit,
        searchCompany: searchQuery.company || undefined,
        searchNumber: searchQuery.number || undefined,
        searchPostcode: searchQuery.postcode || undefined,
        cursor: useCursorPagination ? cursor : undefined,
        useCursor: useCursorPagination ? 'true' : undefined,
    }), [page, useCursorPagination, limit, searchQuery, cursor]);

    const { data, isLoading, isFetching, error } = usePaginatedCompanyHouse(queryParams);
    const { toast } = useToast();
    
    const deleteAllMutation = useDeleteAllCompanyHouseData();

    // Scroll to top when page or cursor changes
    useEffect(() => {
        if (reference.current) {
            reference.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, [page, cursor, useCursorPagination]);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery({
            company: searchCompany,
            number: searchNumber,
            postcode: searchPostcode
        });
        setPage(1);
        setCursor(null); // Reset cursor on new search
        setUseCursorPagination(false); // Use traditional pagination for searches
    }, [searchCompany, searchNumber, searchPostcode]);

    const handleNextPage = useCallback(() => {
        if (useCursorPagination) {
            // Cursor-based pagination
            if (data?.pagination && 'nextCursor' in data.pagination && data.pagination.nextCursor) {
                setCursor(data.pagination.nextCursor);
            }
        } else {
            // Traditional pagination
            setPage(prev => prev + 1);
        }
    }, [useCursorPagination, data?.pagination]);

    const handlePreviousPage = useCallback(() => {
        if (useCursorPagination) {
            // For cursor pagination, we can't go back easily
            // You might want to implement a cursor history stack
            setUseCursorPagination(false);
            setPage(1);
            setCursor(null);
        } else {
            setPage(prev => prev - 1);
        }
    }, [useCursorPagination]);

    const handlePageJump = useCallback((targetPage: number) => {
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
    }, []);

    const handleDeleteAll = useCallback(() => {
        deleteAllMutation.mutate(undefined, {
            onSuccess: (data) => {
                toast({
                    title: "Success",
                    description: `Successfully deleted ${data.deletedCount} CompanyHouse records. Page will refresh in 2 seconds.`,
                    variant: "default",
                });
                
                // Refresh the page after 2 seconds
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            },
            onError: (error: any) => {
                toast({
                    title: "Error",
                    description: error.response?.data?.message || "Failed to delete CompanyHouse data.",
                    variant: "destructive",
                });
            }
        });
    }, [deleteAllMutation, toast]);

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

    // Memoize address formatting function
    const formatAddress = useCallback((regAddress: any) => {
        if (!regAddress) {
            // Return all address keys with empty values if no address data
            return [
                { label: 'Address Line 1', value: '' },
                { label: 'Address Line 2', value: '' },
                { label: 'Post Town', value: '' },
                { label: 'County', value: '' },
                { label: 'Post Code', value: '' }
            ];
        }
        
        // Return all address components, including empty ones
        const addressComponents = [
            { label: 'Address Line 1', value: regAddress.AddressLine1 || '' },
            { label: 'Address Line 2', value: regAddress.AddressLine2 || '' },
            { label: 'Post Town', value: regAddress.PostTown || '' },
            { label: 'County', value: regAddress.County || '' },
            { label: 'Post Code', value: regAddress.PostCode || '' }
        ];
        
        return addressComponents;
    }, []);

    // Memoize status badge color logic
    const getStatusBadgeVariant = useCallback((status: string) => {
        switch (status) {
            case 'Active':
                return 'default'; // Green
            case 'Dissolved':
                return 'destructive'; // Red
            default:
                return 'secondary'; // Gray
        }
    }, []);

    // Mobile card component for responsive design
    const MobileCompanyCard = useCallback(({ item }: { item: any }) => (
        <Card className="mb-4">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <span className="truncate">{item.CompanyName}</span>
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span className="font-mono">{item.CompanyNumber}</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={getStatusBadgeVariant(item.CompanyStatus)}>
                        {item.CompanyStatus || 'Unknown'}
                    </Badge>
                </div>
                
                {item.IncorporationDate && (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            <span className="font-medium">Incorporated:</span> {item.IncorporationDate}
                        </span>
                    </div>
                )}
                
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Address:</span>
                    </div>
                    <div className="ml-6 space-y-1">
                        {formatAddress(item.RegAddress).map((component, index) => (
                            <div key={index} className="text-sm">
                                <span className="font-medium text-muted-foreground">
                                    {component.label}:
                                </span>{' '}
                                <span className={component.value ? '' : 'text-muted-foreground italic'}>
                                    {component.value || 'N/A'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    ), [formatAddress, getStatusBadgeVariant]);

    return (
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold">Company House Data</h1>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    disabled={deleteAllMutation.isPending}
                                    className="flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {deleteAllMutation.isPending ? 'Deleting...' : 'Delete All'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600">Delete All Company House Data</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-2">
                                        <p>
                                            <strong>Warning:</strong> This action will permanently delete all Company House data from the database.
                                        </p>
                                        <p>
                                            This action cannot be undone. All companies, addresses, and related information will be lost.
                                        </p>
                                        <p>
                                            Are you sure you want to proceed?
                                        </p>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAll}
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={deleteAllMutation.isPending}
                                    >
                                        {deleteAllMutation.isPending ? 'Deleting...' : 'Yes, Delete All'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {data?.pagination && renderPaginationInfo()}
                    </div>
                </div>

                {/* Search Form */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by company name..."
                                        value={searchCompany}
                                        onChange={(e) => setSearchCompany(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by company number..."
                                        value={searchNumber}
                                        onChange={(e) => setSearchNumber(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by postcode..."
                                        value={searchPostcode}
                                        onChange={(e) => setSearchPostcode(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isLoading || isFetching} className="w-full sm:w-auto">
                                    {(isLoading || isFetching) ? 'Searching...' : 'Search'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Content Section */}
            {isMobile ? (
                // Mobile View - Cards
                <div className="space-y-4">
                    {(isLoading || isFetching) && (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="text-sm">Loading...</span>
                            </div>
                        </div>
                    )}
                    
                    {error ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center text-red-600">
                                    Error loading data: {error.message}
                                </div>
                            </CardContent>
                        </Card>
                    ) : !data?.data.length && !isLoading ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center text-muted-foreground">
                                    No companies found
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        data?.data.map((item) => (
                            <MobileCompanyCard key={item._id} item={item} />
                        ))
                    )}
                </div>
            ) : (
                // Desktop View - Table
                <Card>
                    <div className="relative">
                        {(isLoading || isFetching) && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    <span className="text-sm">Loading...</span>
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <Table className="table-fixed w-full min-w-[800px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[25%] p-3">Company Name</TableHead>
                                        <TableHead className="w-[12%] p-3">Company Number</TableHead>
                                        <TableHead className="w-[35%] p-3">Address</TableHead>
                                        <TableHead className="w-[13%] p-3">Status</TableHead>
                                        <TableHead className="w-[15%] p-3">Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {error ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-red-600 py-8">
                                                Error loading data: {error.message}
                                            </TableCell>
                                        </TableRow>
                                    ) : !data?.data.length && !isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                No companies found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((item) => (
                                            <TableRow key={item._id} className="hover:bg-muted/50">
                                                <TableCell className="p-3">
                                                    <div className="font-medium text-sm leading-tight break-words">
                                                        {item.CompanyName}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-3">
                                                    <div className="font-mono text-xs break-all">
                                                        {item.CompanyNumber}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-3">
                                                    <div className="text-xs space-y-0.5">
                                                        {formatAddress(item.RegAddress).map((component, index) => (
                                                            <div key={index} className="flex flex-col sm:flex-row sm:gap-1">
                                                                <span className="font-medium text-muted-foreground whitespace-nowrap text-[10px] sm:text-xs">
                                                                    {component.label}:
                                                                </span>
                                                                <span className={`break-words text-[10px] sm:text-xs ${
                                                                    component.value 
                                                                        ? 'text-foreground' 
                                                                        : 'text-muted-foreground italic'
                                                                }`}>
                                                                    {component.value || 'N/A'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-3">
                                                    <Badge variant={getStatusBadgeVariant(item.CompanyStatus)} className="text-xs">
                                                        {item.CompanyStatus || 'Unknown'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="p-3">
                                                    <div className="space-y-1 text-xs">
                                                        {item.IncorporationDate && (
                                                            <div className="flex flex-col sm:flex-row sm:gap-1">
                                                                <span className="font-medium whitespace-nowrap text-[10px] sm:text-xs">Incorporated:</span>
                                                                <span className="text-muted-foreground text-[10px] sm:text-xs">{item.IncorporationDate}</span>
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
                    </div>
                </Card>
            )}

            {/* Pagination */}
            {data?.pagination && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground order-2 sm:order-1">
                        {renderPaginationInfo()}
                    </div>
                    <Pagination className="order-1 sm:order-2">
                        <PaginationContent>
                            {renderPaginationButtons()}
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}