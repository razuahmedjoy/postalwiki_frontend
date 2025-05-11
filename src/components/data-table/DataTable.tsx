import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface DataTableColumn {
  header: string;
  accessorKey?: string;
  sortable?: boolean;
  cell?: ({ row }: { row: any }) => React.ReactNode;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalItems: number;
}

interface DataTableProps {
  columns: DataTableColumn[];
  data: any[];
  isLoading?: boolean;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onSortChange?: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  isLoading = false,
  meta,
  onPageChange,
  onSortChange,
  sortBy,
  sortOrder = 'asc'
}) => {
  // Handle sort column click
  const handleSortClick = (field: string) => {
    if (onSortChange && columns.find(c => c.accessorKey === field)?.sortable) {
      onSortChange(field);
    }
  };

  // Render sort indicator for a column
  const renderSortIndicator = (field: string) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? 
        <ArrowUp className="ml-2 h-4 w-4" /> : 
        <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return null;
  };

  // Generate page links for pagination
  const generatePageLinks = () => {
    if (!meta) return null;
    
    const { currentPage, totalPages } = meta;
    const pageLinks = [];
    
    // Always show first page
    pageLinks.push(
      <PaginationItem key="first">
        <PaginationLink
          onClick={() => onPageChange?.(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      pageLinks.push(
        <PaginationItem key="ellipsis-start">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last pages as they're always shown
      pageLinks.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onPageChange?.(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pageLinks.push(
        <PaginationItem key="ellipsis-end">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pageLinks.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => onPageChange?.(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return pageLinks;
  };

  // Render loading skeleton rows
  const renderSkeletonRows = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {columns.map((column, colIndex) => (
          <TableCell key={`skeleton-cell-${colIndex}`}>
            <Skeleton className="h-8 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.accessorKey || column.header}
                  className={column.sortable ? 'cursor-pointer select-none' : ''}
                  onClick={() => column.sortable && column.accessorKey && handleSortClick(column.accessorKey)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && column.accessorKey && renderSortIndicator(column.accessorKey)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              renderSkeletonRows()
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={`row-${rowIndex}`}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                      {column.cell 
                        ? column.cell({ row }) 
                        : column.accessorKey ? row[column.accessorKey] : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {meta && onPageChange && (
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(meta.currentPage - 1) * meta.perPage + 1} to {Math.min(meta.currentPage * meta.perPage, meta.totalItems)} of {meta.totalItems} entries
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, meta.currentPage - 1))}
                  className={meta.currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {generatePageLinks()}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(meta.totalPages, meta.currentPage + 1))}
                  className={meta.currentPage === meta.totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default DataTable;
