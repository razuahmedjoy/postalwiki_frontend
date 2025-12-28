import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { usePostcodeSearch, usePostcodeCreate, usePostcodeUpdate, usePostcodeDelete, PostcodeDistrict } from '@/api/postcodeDistrict';
import { Search, Plus, Save, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const PostcodeSearch: React.FC = () => {
    // Search State
    const [filters, setFilters] = useState({ postcode: '', district: '' });
    const [queryParams, setQueryParams] = useState({ postcode: '', district: '', page: 1, limit: 500 });
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Hooks
    const { data: searchData, isLoading, isPlaceholderData } = usePostcodeSearch(queryParams);
    const createMutation = usePostcodeCreate();
    const updateMutation = usePostcodeUpdate();
    const deleteMutation = usePostcodeDelete();

    // Local UI State
    const [newPostcode, setNewPostcode] = useState('');
    const [newDistrict, setNewDistrict] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Handlers
    const handleFilter = () => {
        setQueryParams(prev => ({
            ...prev,
            postcode: filters.postcode,
            district: filters.district,
            page: 1
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleFilter();
    };

    const handlePageChange = (newPage: number) => {
        // Scroll to top of table
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setQueryParams(prev => ({ ...prev, page: newPage }));
    };

    const handleAdd = async () => {
        if (!newPostcode || !newDistrict) {
            toast.error('Postcode and District required.');
            return;
        }
        try {
            await createMutation.mutateAsync({ postcode: newPostcode, district: newDistrict });
            toast.success('Entry added.');
            setNewPostcode('');
            setNewDistrict('');
            setIsCreateOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add.');
        }
    };

    const startEdit = (item: PostcodeDistrict) => {
        setEditingId(item._id);
        setEditValue(item.district);
    };

    const saveEdit = async (id: string) => {
        try {
            await updateMutation.mutateAsync({ id, district: editValue });
            setEditingId(null);
            toast.success('Updated successfully.');
        } catch (error) {
            toast.error('Update failed.');
        }
    };

    const deleteItem = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Deleted successfully.');
        } catch (error) {
            toast.error('Deletion failed.');
        }
    };

    const results = searchData?.data || [];
    const totalCount = searchData?.total || 0;
    const totalPages = searchData?.totalPages || 1;
    const currentPage = queryParams.page;

    return (
        <div className="space-y-6 p-6 min-h-screen pb-24 relative">
            <Card className="min-h-[600px] flex flex-col">
                <CardHeader className="pb-3 flex-none">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Search & Manage</CardTitle>
                            <CardDescription>Search for postcodes, update districts, or add new entries.</CardDescription>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" /> Add Entry
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Postcode District</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Postcode</label>
                                        <Input
                                            placeholder="e.g. AB10 1AB"
                                            value={newPostcode}
                                            onChange={e => setNewPostcode(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">District Name</label>
                                        <Input
                                            placeholder="e.g. Aberdeen"
                                            value={newDistrict}
                                            onChange={e => setNewDistrict(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleAdd} disabled={createMutation.isPending} className="w-full">
                                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Entry'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 flex-1 flex flex-col">

                    {/* Filter Section */}
                    <div className="flex gap-4 items-end bg-muted/20 p-4 rounded-lg flex-none">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Search Postcode</label>
                            <Input
                                placeholder="Postcode regex..."
                                value={filters.postcode}
                                onChange={e => setFilters(prev => ({ ...prev, postcode: e.target.value }))}
                                onKeyDown={handleKeyDown}
                                className="bg-background"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Search District</label>
                            <Input
                                placeholder="District regex..."
                                value={filters.district}
                                onChange={e => setFilters(prev => ({ ...prev, district: e.target.value }))}
                                onKeyDown={handleKeyDown}
                                className="bg-background"
                            />
                        </div>
                        <Button onClick={handleFilter} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                            Filter Results
                        </Button>
                    </div>

                    {/* Results Table */}
                    <div className="border rounded-md flex-1">
                        <Table>
                            <TableHeader className="dark:bg-slate-900 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[150px]">Post Code</TableHead>
                                    <TableHead className="w-[200px]">District</TableHead>
                                    <TableHead className="w-[150px] text-right">Actions</TableHead>
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
                                            <TableCell className="py-1 font-medium font-mono text-xs">{item.postcode}</TableCell>
                                            <TableCell className="py-2 text-xs">
                                                {editingId === item._id ? (
                                                    <Input
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        className="h-7 text-xs"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    item.district
                                                )}
                                            </TableCell>
                                            <TableCell className="py-2 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {editingId === item._id ? (
                                                        <>
                                                            <Button size="sm" className="h-7 w-7 p-0" variant="secondary" onClick={() => saveEdit(item._id)} disabled={updateMutation.isPending}>
                                                                <Save className="h-3 w-3" />
                                                            </Button>
                                                            <Button size="sm" className="h-7 w-7 p-0" variant="ghost" onClick={() => setEditingId(null)}>
                                                                x
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button size="sm" className="h-7 px-2 text-xs" variant="outline" onClick={() => startEdit(item)}>
                                                                Edit
                                                            </Button>
                                                            <Button size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" variant="ghost" onClick={() => deleteItem(item._id)} disabled={deleteMutation.isPending}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                </CardContent>
            </Card>

            {/* Floating Pagination Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 min-w-[300px] z-50">
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

export default PostcodeSearch;
