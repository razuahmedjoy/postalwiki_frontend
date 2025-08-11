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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Search, 
    Filter, 
    Eye, 
    CheckCircle, 
    Clock,
    ExternalLink,
    FileText
} from 'lucide-react';
import { usePaginatedAdultKeywordsReferences } from '@/api/adultKeywords';
import { AdultKeywordsReference } from '@/types/adultKeywords';

export function AdultKeywordsReferencesTable() {
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [matchType, setMatchType] = useState<string>('all');
    const [processed, setProcessed] = useState<boolean | null>(null);
    const [searchUrl, setSearchUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, isFetching } = usePaginatedAdultKeywordsReferences(
        page, 
        limit, 
        matchType === 'all' ? undefined : matchType, 
        processed
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchUrl(searchQuery);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleFilterChange = (newMatchType: string) => {
        setMatchType(newMatchType);
        setPage(1);
    };

    const handleProcessedChange = (newProcessed: string) => {
        if (newProcessed === 'all') {
            setProcessed(null);
        } else {
            setProcessed(newProcessed === 'true');
        }
        setPage(1);
    };

    const getMatchTypeBadge = (matchType: string) => {
        if (matchType === 'exact') {
            return <Badge variant="destructive">Exact Match</Badge>;
        }
        return <Badge variant="secondary">Contains Match</Badge>;
    };

    const getProcessedBadge = (processed: boolean) => {
        if (processed) {
            return <Badge variant="default" className="bg-green-600">Processed</Badge>;
        }
        return <Badge variant="outline">Pending</Badge>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Adult Keywords References</h2>
                    <p className="text-muted-foreground">
                        Review and manage URLs flagged for adult content keywords
                    </p>
                </div>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters & Search
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2 lg:col-span-2">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <Input
                                    placeholder="Search by URL..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" size="sm" className="flex-shrink-0">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>

                        {/* Match Type Filter */}
                        <div className="w-full">
                            <Select value={matchType} onValueChange={handleFilterChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Match Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Match Types</SelectItem>
                                    <SelectItem value="exact">Exact Matches</SelectItem>
                                    <SelectItem value="contains">Contains Matches</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Processed Filter */}
                        <div className="w-full">
                            <Select value={processed === null ? 'all' : processed.toString()} onValueChange={handleProcessedChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="false">Pending</SelectItem>
                                    <SelectItem value="true">Processed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Summary */}
            {data && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} references
                    </span>
                    {isFetching && (
                        <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Updating...
                        </span>
                    )}
                </div>
            )}

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {/* Mobile Notice */}
                    <div className="p-4 text-center text-sm text-muted-foreground border-b md:hidden">
                        <p>💡 Table adapts to screen size - scroll horizontally if needed</p>
                    </div>
                    
                    <div className="relative md:overflow-x-auto max-w-full">
                        <div className="inline-block min-w-full align-middle w-full">
                            <Table className="w-full border-collapse table-fixed md:table-auto">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px] md:min-w-[180px] bg-muted/50 sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">URL</TableHead>
                                        <TableHead className="min-w-[250px] md:min-w-[350px] bg-muted/50">Content Details</TableHead>
                                        <TableHead className="min-w-[100px] md:min-w-[120px] bg-muted/50">Matched Keywords</TableHead>
                                        <TableHead className="min-w-[80px] md:min-w-[100px] bg-muted/50">Match Type</TableHead>
                                        <TableHead className="min-w-[60px] md:min-w-[80px] bg-muted/50">Status</TableHead>
                                        <TableHead className="min-w-[80px] md:min-w-[100px] bg-muted/50">Source</TableHead>
                                        <TableHead className="min-w-[100px] md:min-w-[120px] bg-muted/50">Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.references.map((reference) => (
                                        <TableRow key={reference._id} className="hover:bg-muted/50">
                                            <TableCell className="min-w-[120px] md:min-w-[180px] max-w-[200px] sticky left-0 bg-background z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`http://${reference.url}`}
                                                        target="_blank"
                                                        className="text-blue-600 hover:underline truncate text-sm"
                                                        title={reference.url}
                                                    >
                                                        {reference.url}
                                                    </a>
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-[250px] md:min-w-[350px] max-w-[400px]">
                                                <div className="space-y-3">
                                                    {reference.title && (
                                                        <div>
                                                            <div className="text-xs font-medium text-muted-foreground mb-2">Title:</div>
                                                            <div className="text-sm leading-relaxed break-words whitespace-pre-wrap" title={reference.title}>
                                                                {reference.title}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {reference.meta_description && (
                                                        <div>
                                                            <div className="text-xs font-medium text-muted-foreground mb-2">Description:</div>
                                                            <div className="text-sm leading-relaxed break-words whitespace-pre-wrap" title={reference.meta_description}>
                                                                {reference.meta_description}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {reference.keywords && (
                                                        <div>
                                                            <div className="text-xs font-medium text-muted-foreground mb-2">Keywords:</div>
                                                            <div className="text-sm leading-relaxed break-words whitespace-pre-wrap" title={reference.keywords}>
                                                                {reference.keywords}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!reference.title && !reference.meta_description && !reference.keywords && (
                                                        <div className="text-sm text-muted-foreground italic">No content data</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-[100px] md:min-w-[120px] max-w-[150px]">
                                                <div className="flex flex-wrap gap-1">
                                                    {reference.matched_keywords.slice(0, 3).map((keyword, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {keyword}
                                                        </Badge>
                                                    ))}
                                                    {reference.matched_keywords.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{reference.matched_keywords.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-[80px] md:min-w-[100px]">
                                                {getMatchTypeBadge(reference.match_type)}
                                            </TableCell>
                                            <TableCell className="min-w-[60px] md:min-w-[80px]">
                                                {getProcessedBadge(reference.processed)}
                                            </TableCell>
                                            <TableCell className="min-w-[80px] md:min-w-[100px] max-w-[120px]">
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                    <span className="truncate text-xs" title={reference.csv_source}>
                                                        {reference.csv_source}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-[100px] md:min-w-[120px] text-sm text-muted-foreground">
                                                {formatDate(reference.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {data && data.pagination.pages > 1 && (
                <div className="overflow-x-auto">
                    <Pagination>
                        <PaginationContent className="flex-wrap justify-center">
                            <PaginationItem>
                                <PaginationPrevious 
                                    onClick={() => handlePageChange(page - 1)}
                                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                            
                            {/* Show fewer page numbers on mobile */}
                            {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            onClick={() => handlePageChange(pageNum)}
                                            isActive={page === pageNum}
                                            className="cursor-pointer"
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}
                            
                            {data.pagination.pages > 5 && (
                                <>
                                    {page > 3 && <PaginationItem><span className="px-2">...</span></PaginationItem>}
                                    {page > 3 && page < data.pagination.pages - 2 && (
                                        <PaginationItem>
                                            <PaginationLink onClick={() => handlePageChange(page)} isActive>
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )}
                                    {page < data.pagination.pages - 2 && <PaginationItem><span className="px-2">...</span></PaginationItem>}
                                    {page < data.pagination.pages - 2 && (
                                        <PaginationItem>
                                            <PaginationLink onClick={() => handlePageChange(data.pagination.pages)}>
                                                {data.pagination.pages}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )}
                                </>
                            )}
                            
                            <PaginationItem>
                                <PaginationNext 
                                    onClick={() => handlePageChange(page + 1)}
                                    className={page >= data.pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* No Results */}
            {data && data.references.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No references found</h3>
                        <p className="text-muted-foreground">
                            Try adjusting your filters or search criteria
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 