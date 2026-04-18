import React, { useEffect, useMemo, useState } from 'react';
import { usePaginatedRMAddress } from '@/api/rmAddress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function RMAddressTable({ reference }: { reference: React.RefObject<HTMLDivElement> }) {
  const [page, setPage] = useState(1);
  const [searchPostcode, setSearchPostcode] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState({
    postcode: '',
    district: '',
    address: ''
  });

  const limit = 200;

  const queryParams = useMemo(() => ({
    page,
    limit,
    searchPostcode: searchQuery.postcode || undefined,
    searchDistrict: searchQuery.district || undefined,
    searchAddress: searchQuery.address || undefined,
  }), [page, limit, searchQuery]);

  const { data, isLoading, isFetching } = usePaginatedRMAddress(queryParams);

  useEffect(() => {
    if (reference.current) {
      reference.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [page, reference]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery({
      postcode: searchPostcode,
      district: searchDistrict,
      address: searchAddress
    });
    setPage(1);
  };

  const totalPages = data?.pagination?.totalPages || 1;
  const currentPage = data?.pagination?.page || page;

  return (
    <div className="container mx-auto py-4 min-h-screen pb-24 relative">
      <div className="mb-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">RM Address View</h1>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            type="text"
            placeholder="Search postcode"
            value={searchPostcode}
            onChange={(e) => setSearchPostcode(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Search district"
            value={searchDistrict}
            onChange={(e) => setSearchDistrict(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Search address"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
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
              <TableHead className="w-[160px]">Postcode</TableHead>
              <TableHead className="w-[200px]">District</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-[130px]">Date</TableHead>
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
                  <TableCell>{item.district}</TableCell>
                  <TableCell className="text-sm">{item.address}</TableCell>
                  <TableCell className="text-sm">{item.dateCreated || '-'}</TableCell>
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
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1 || isLoading || isFetching}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium whitespace-nowrap tabular-nums">
            Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
            <span className="ml-2 text-muted-foreground text-xs font-normal">
              ({data?.pagination?.total?.toLocaleString() || 0} items)
            </span>
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages || isLoading || isFetching}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
