import React from 'react';
import { useMongoDBStats } from '@/api/mongodb';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader } from '@/components/ui/loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const formatSize = (bytes: number, decimalPlaces = 2) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  bytes = Math.max(bytes, 0);
  const pow = Math.floor((bytes ? Math.log(bytes) : 0) / Math.log(1024));
  const pow2 = Math.min(pow, units.length - 1);
  bytes /= Math.pow(1024, pow2);
  return `${bytes.toFixed(decimalPlaces)} ${units[pow2]}`;
};

const MongoDBStats: React.FC = () => {
  const { data: collections, isLoading, isError, error } = useMongoDBStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load MongoDB statistics'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">MongoDB Collection Statistics</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collection Name</TableHead>
              <TableHead>Document Count</TableHead>
              <TableHead>Collection Size</TableHead>
              <TableHead>Avg. Object Size</TableHead>
              <TableHead>Index Information</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections?.map((collection) => (
              <TableRow key={collection.collectionName}>
                <TableCell className="font-medium">{collection.collectionName}</TableCell>
                <TableCell>{collection.documentCount.toLocaleString()}</TableCell>
                <TableCell>
                  {formatSize(collection.size)} / {formatSize(collection.storageSize)}
                </TableCell>
                <TableCell>{formatSize(collection.avgObjSize)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-semibold">Count: {collection.indexCount}</div>
                    {collection.indexes.map((index) => (
                      <div key={index.name} className="text-sm">
                        {index.name} ({index.keys.join(', ')}){index.isUnique ? ' (unique)' : ''}
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default MongoDBStats; 