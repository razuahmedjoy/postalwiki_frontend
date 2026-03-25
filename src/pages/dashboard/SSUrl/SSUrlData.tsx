import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useSSUrlSearch } from '@/api/ssUrl';

const IMAGE_BASE_URL = 'https://h1m7.c11.e2-4.dev';

const SSUrlData: React.FC = () => {
    const [filters, setFilters] = useState({ url: '', image: '' });
    const [queryParams, setQueryParams] = useState({ url: '', image: '', page: 1, limit: 500 });

    const { data: searchData, isLoading, isPlaceholderData } = useSSUrlSearch(queryParams);

    const handleFilter = () => {
        setQueryParams((prev) => ({
            ...prev,
            url: filters.url,
            image: filters.image,
            page: 1,
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleFilter();
        }
    };

    const handlePageChange = (newPage: number) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setQueryParams((prev) => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextLimit = Number(e.target.value);
        setQueryParams((prev) => ({
            ...prev,
            page: 1,
            limit: nextLimit,
        }));
    };

    const results = searchData?.data || [];
    const totalCount = searchData?.total || 0;
    const totalPages = searchData?.totalPages || 1;
    const currentPage = queryParams.page;

    return (
        <div className="space-y-6 p-6 min-h-screen pb-24 relative">
            <Card className="min-h-[600px] flex flex-col">
                <CardHeader className="pb-3 flex-none">
                    <CardTitle>SS URL Records</CardTitle>
                    <CardDescription>View and verify imported SS URL records with server-side pagination.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 flex-1 flex flex-col">
                    <div className="flex gap-4 items-end bg-muted/20 p-4 rounded-lg flex-none">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Search URL</label>
                            <Input
                                placeholder="e.g. xyz.com"
                                value={filters.url}
                                onChange={(e) => setFilters((prev) => ({ ...prev, url: e.target.value }))}
                                onKeyDown={handleKeyDown}
                                className="bg-background"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Search Image Path</label>
                            <Input
                                placeholder="e.g. bucket/image.webp"
                                value={filters.image}
                                onChange={(e) => setFilters((prev) => ({ ...prev, image: e.target.value }))}
                                onKeyDown={handleKeyDown}
                                className="bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Rows</label>
                            <select
                                value={queryParams.limit}
                                onChange={handleLimitChange}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value={100}>100</option>
                                <option value={250}>250</option>
                                <option value={500}>500</option>
                                <option value={1000}>1000</option>
                            </select>
                        </div>
                        <Button onClick={handleFilter} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                            Filter Results
                        </Button>
                    </div>

                    <div className="border rounded-md flex-1 overflow-hidden">
                        <Table>
                            <TableHeader className="dark:bg-slate-900 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[45%]">URL</TableHead>
                                    <TableHead className="w-[45%]">Image</TableHead>
                                    <TableHead className="w-[10%]">ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-32 text-muted-foreground">
                                            {isLoading ? 'Loading...' : 'No results found.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    results.map((item) => (
                                        <TableRow key={item._id} className="h-10">
                                            <TableCell className="py-2 text-xs break-all">{item.url}</TableCell>
                                            <TableCell className="py-2 text-xs break-all">
                                                <a
                                                    href={`${IMAGE_BASE_URL}/${item.image}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {item.image}
                                                </a>
                                            </TableCell>
                                            <TableCell className="py-2 text-xs font-mono text-muted-foreground">{item._id.slice(-8)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 min-w-[320px] z-50">
                <div className="bg-background/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-full p-2 px-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm font-medium whitespace-nowrap tabular-nums">
                        Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
                        <span className="ml-2 text-muted-foreground text-xs font-normal">
                            ({totalCount.toLocaleString()} items)
                        </span>
                    </span>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isPlaceholderData || isLoading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SSUrlData;
