import React, { useEffect, useMemo, useState } from 'react';
import { usePaginatedPropPrice } from '@/api/propPrice';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function PropPriceTable({ reference }: { reference: React.RefObject<HTMLDivElement> }) {
  const [page, setPage] = useState(1);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([]);
  const [searchPostcode, setSearchPostcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const limit = 200;

  const queryParams = useMemo(() => ({
    limit,
    cursor,
    searchPostcode: searchQuery || undefined,
  }), [limit, cursor, searchQuery]);

  const { data, isLoading, isFetching } = usePaginatedPropPrice(queryParams);

  useEffect(() => {
    if (reference.current) {
      reference.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page, reference]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchPostcode.trim());
    setPage(1);
    setCursor(null);
    setCursorHistory([]);
  };

  const hasNextPage = Boolean(data?.pagination?.hasNextPage);
  const nextCursor = data?.pagination?.nextCursor || null;

  const handleNextPage = () => {
    if (!hasNextPage || !nextCursor || isLoading || isFetching) return;
    setCursorHistory((prev) => [...prev, cursor]);
    setCursor(nextCursor);
    setPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    if (cursorHistory.length === 0 || isLoading || isFetching) return;

    const previousCursor = cursorHistory[cursorHistory.length - 1] ?? null;
    setCursor(previousCursor);
    setCursorHistory((prev) => prev.slice(0, -1));
    setPage((prev) => Math.max(1, prev - 1));
  };

  const totalItems = data?.pagination?.total;

  return (
    <div className="container mx-auto py-4 min-h-screen pb-24 relative">
      <div className="mb-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Prop Price View</h1>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            type="text"
            placeholder="Search postcode"
            value={searchPostcode}
            onChange={(e) => setSearchPostcode(e.target.value.toUpperCase())}
          />
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
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
              <TableHead className="w-[130px]">Postcode</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-[130px]">Deed Date</TableHead>
              <TableHead className="w-[140px] text-right">Price Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data?.data?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-20">
                  {isLoading ? 'Loading...' : 'No rows found'}
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-mono text-xs">{item.postcode}</TableCell>
                  <TableCell className="text-sm">{item.address_display}</TableCell>
                  <TableCell className="text-sm">{item.deed_date_display}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{item.price_paid_display}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 min-w-[320px] z-50">
        <div className="bg-background/80 backdrop-blur-md border border-slate-200 shadow-xl rounded-full p-2 px-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handlePreviousPage}
            disabled={page <= 1 || cursorHistory.length === 0 || isLoading || isFetching}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium whitespace-nowrap tabular-nums">
            Page {page.toLocaleString()}
            {typeof totalItems === 'number' && totalItems >= 0 ? (
              <span className="ml-2 text-muted-foreground text-xs font-normal">
                ({totalItems.toLocaleString()} items)
              </span>
            ) : (
              <span className="ml-2 text-muted-foreground text-xs font-normal">
                (cursor mode)
              </span>
            )}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleNextPage}
            disabled={!hasNextPage || !nextCursor || isLoading || isFetching}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
