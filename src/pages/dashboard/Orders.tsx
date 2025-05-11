
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import DataTable from '@/components/data-table/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/data-table/DateRangePicker';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import type { DateRange } from 'react-day-picker';

interface OrderParams {
  page: number;
  perPage: number;
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  dateRange: DateRange | undefined;
}

const Orders = () => {
  const [params, setParams] = useState<OrderParams>({
    page: 1,
    perPage: 10,
    search: '',
    status: 'all', // Using 'all' instead of empty string
    sortBy: 'createdAt',
    sortOrder: 'desc',
    dateRange: undefined
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearch = useDebounce(params.search, 500);

  // Fetch orders data with react-query
  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', params.page, params.perPage, debouncedSearch, params.status, params.sortBy, params.sortOrder, params.dateRange],
    queryFn: async () => {
      try {
        // This would normally be an API call to your backend
        // For demo purposes, we'll simulate server-side pagination with mock data
        const mockOrders = generateMockOrders(200);
        
        // Filter based on search term
        let filteredOrders = mockOrders;
        if (debouncedSearch) {
          filteredOrders = mockOrders.filter(order => 
            order.id.toString().includes(debouncedSearch) || 
            order.customerName.toLowerCase().includes(debouncedSearch.toLowerCase())
          );
        }
        
        // Filter by status
        if (params.status && params.status !== 'all') {
          filteredOrders = filteredOrders.filter(order => order.status === params.status);
        }
        
        // Filter by date range
        if (params.dateRange?.from && params.dateRange?.to) {
          filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= params.dateRange!.from! && orderDate <= params.dateRange!.to!;
          });
        }
        
        // Sort orders
        filteredOrders.sort((a: any, b: any) => {
          const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
          if (a[params.sortBy] < b[params.sortBy]) return -1 * sortOrder;
          if (a[params.sortBy] > b[params.sortBy]) return 1 * sortOrder;
          return 0;
        });
        
        // Calculate pagination
        const totalItems = filteredOrders.length;
        const totalPages = Math.ceil(totalItems / params.perPage);
        const startIndex = (params.page - 1) * params.perPage;
        const endIndex = startIndex + params.perPage;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
        
        return {
          orders: paginatedOrders,
          meta: {
            currentPage: params.page,
            totalItems,
            totalPages,
            perPage: params.perPage
          }
        };
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    }
  });

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  // Handle status filter changes
  const handleStatusChange = (value: string) => {
    setParams(prev => ({ ...prev, status: value, page: 1 }));
  };

  // Handle date range filter changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setParams(prev => ({ ...prev, dateRange: range, page: 1 }));
  };

  // Handle sorting changes
  const handleSortChange = (field: string) => {
    setParams(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setParams(prev => ({ ...prev, page }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setParams({
      page: 1,
      perPage: 10,
      search: '',
      status: 'all', // Using 'all' instead of empty string
      sortBy: 'createdAt',
      sortOrder: 'desc',
      dateRange: undefined
    });
  };

  if (isError) {
    toast({
      variant: "destructive",
      title: "Error loading orders",
      description: "There was an error loading the order data."
    });
  }

  // Define columns for the DataTable
  const columns = [
    {
      header: 'Order ID',
      accessorKey: 'id',
      sortable: true
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      sortable: true
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: ({ row }: { row: any }) => {
        // Add null check for row.original
        if (!row?.original) return null;
        
        const status = row.original.status;
        if (!status) return null;
        
        const statusStyles = {
          'pending': 'bg-yellow-100 text-yellow-800',
          'processing': 'bg-blue-100 text-blue-800',
          'completed': 'bg-green-100 text-green-800',
          'cancelled': 'bg-red-100 text-red-800',
        };
        
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
        );
      },
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: ({ row }: { row: any }) => {
        // Add null check
        if (!row?.original?.amount) return 'N/A';
        return `$${row.original.amount.toFixed(2)}`;
      },
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      sortable: true,
      cell: ({ row }: { row: any }) => {
        // Add null check
        if (!row?.original?.createdAt) return 'N/A';
        return new Date(row.original.createdAt).toLocaleDateString();
      },
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            👁️
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            🔄
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-4 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold md:text-2xl">Orders</h1>
      </div>
      
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by order ID or customer name..."
              value={params.search}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
          
          <Select value={params.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <DateRangePicker 
            date={params.dateRange} 
            onDateChange={handleDateRangeChange} 
          />
        </div>
        
        <div className="mt-2 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      <DataTable 
        columns={columns}
        data={data?.orders || []}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        sortBy={params.sortBy}
        sortOrder={params.sortOrder}
      />
    </div>
  );
};

// Helper function to generate mock order data
const generateMockOrders = (count: number) => {
  const statuses = ['pending', 'processing', 'completed', 'cancelled'];
  const customers = [
    'John Smith', 'Emily Johnson', 'Michael Brown', 'Sarah Wilson', 
    'David Miller', 'Jennifer Davis', 'Robert Taylor', 'Jessica Anderson', 
    'Thomas Martinez', 'Lisa Thompson'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const id = 10000 + i;
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
    
    return {
      id,
      customerName: customers[Math.floor(Math.random() * customers.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      amount: Math.floor(Math.random() * 500) + 10 + Math.random(),
      createdAt: randomDate.toISOString(),
      items: Math.floor(Math.random() * 5) + 1
    };
  });
};

export default Orders;
