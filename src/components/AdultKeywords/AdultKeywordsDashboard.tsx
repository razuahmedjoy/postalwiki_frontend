import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Play, 
    Square, 
    FileText, 
    AlertTriangle, 
    CheckCircle, 
    Clock,
    Database,
    Eye,
    RefreshCw
} from 'lucide-react';
import { 
    useAdultKeywordsProgress, 
    useAdultKeywordsStats, 
    useStartAdultKeywordsMatching, 
    useStopAdultKeywordsMatching,
    getProgressPercentage,
    getStatusText,
    getStatusColor
} from '@/api/adultKeywords';
import { AdultKeywordsProgress } from '@/types/adultKeywords';

export function AdultKeywordsDashboard() {
    const [showErrors, setShowErrors] = useState(false);
    const [isPollingEnabled, setIsPollingEnabled] = useState(false);
    
    const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useAdultKeywordsProgress(isPollingEnabled);
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdultKeywordsStats();
    
    const startMatching = useStartAdultKeywordsMatching();
    const stopMatching = useStopAdultKeywordsMatching();

    // Enable polling when processing starts
    const handleStartMatching = async () => {
        try {
            setIsPollingEnabled(true); // Start polling immediately
            await startMatching.mutateAsync();
        } catch (error) {
            console.error('Failed to start matching:', error);
            setIsPollingEnabled(false); // Stop polling on error
        }
    };

    const handleStopMatching = async () => {
        try {
            await stopMatching.mutateAsync();
            // Keep polling enabled briefly to get final status
            setTimeout(() => {
                setIsPollingEnabled(false);
            }, 3000); // Wait 3 seconds to get final progress
        } catch (error) {
            console.error('Failed to stop matching:', error);
            setIsPollingEnabled(false);
        }
    };

    // Manual refresh function
    const handleManualRefresh = () => {
        refetchProgress();
        refetchStats();
    };

    // Auto-disable polling when processing completes
    React.useEffect(() => {
        if (progress && (progress.isComplete || !progress.isRunning)) {
            // Stop polling after a brief delay to ensure we get final status
            const timer = setTimeout(() => {
                setIsPollingEnabled(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [progress]);

    const isLoading = progressLoading || statsLoading;
    const isRunning = progress?.isRunning || false;
    const isComplete = progress?.isComplete || false;

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
                    <h1 className="text-3xl font-bold tracking-tight">Adult Keywords Matching</h1>
                    <p className="text-muted-foreground">
                        Process CSV files to identify and handle adult content keywords
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <Button
                        onClick={handleStartMatching}
                        disabled={isRunning || startMatching.isPending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        {startMatching.isPending ? 'Starting...' : 'Start Matching'}
                    </Button>
                    
                    <Button
                        onClick={handleStopMatching}
                        disabled={!isRunning || stopMatching.isPending}
                        variant="destructive"
                    >
                        <Square className="mr-2 h-4 w-4" />
                        {stopMatching.isPending ? 'Stopping...' : 'Stop Matching'}
                    </Button>

                    {/* Manual Refresh Button */}
                    <Button
                        onClick={handleManualRefresh}
                        disabled={progressLoading}
                        variant="outline"
                        size="sm"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${progressLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Status and Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Current Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge 
                                variant={isRunning ? "default" : isComplete ? "secondary" : "outline"}
                                className={getStatusColor(progress || { isRunning: false, isComplete: false } as AdultKeywordsProgress)}
                            >
                                {getStatusText(progress || { isRunning: false, isComplete: false } as AdultKeywordsProgress)}
                            </Badge>
                            {progress?.currentFile && (
                                <span className="text-sm text-muted-foreground">
                                    {progress.currentFile}
                                </span>
                            )}
                            {/* Polling Status Indicator */}
                            <Badge variant="outline" className="text-xs">
                                {isPollingEnabled ? '🔄 Live Updates' : '⏸️ Updates Paused'}
                            </Badge>
                        </div>
                        
                        {progress && progress.total > 0 && (
                            <span className="text-sm text-muted-foreground">
                                {progress.processed} / {progress.total} records
                            </span>
                        )}
                    </div>

                    {progress && progress.total > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{getProgressPercentage(progress)}%</span>
                            </div>
                            <Progress value={getProgressPercentage(progress)} className="h-2" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Statistics - Live Progress Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Live Progress Statistics
                    </CardTitle>
                    <CardDescription className="flex items-center justify-between">
                        <span>Real-time statistics from current processing session</span>
                        <Button
                            onClick={() => refetchProgress()}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            disabled={progressLoading}
                        >
                            <RefreshCw className={`h-3 w-3 ${progressLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardDescription>
                    {progress?.currentFile && (
                        <div className="text-sm text-muted-foreground">
                            Currently processing: <span className="font-mono">{progress.currentFile}</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                                <Database className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{progress?.total || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total records to process
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Processed</CardTitle>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{progress?.processed || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Records processed so far
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Exact Matches</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{progress?.exactMatches || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Direct keyword matches found
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Contains Matches</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{progress?.containsMatches || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Partial keyword matches found
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            {/* Database Summary - Overall Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Database Summary
                    </CardTitle>
                    <CardDescription className="flex items-center justify-between">
                        <span>
                            Overall statistics from the adult keywords database
                            {stats && (
                                <span className="ml-2 text-xs">
                                    • Last updated: {new Date().toLocaleTimeString()}
                                </span>
                            )}
                        </span>
                        <Button
                            onClick={() => refetchStats()}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            disabled={statsLoading}
                        >
                            <RefreshCw className={`h-3 w-3 ${statsLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats?.totalReferences || 0}</div>
                            <div className="text-sm text-muted-foreground">Total References</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{stats?.unprocessedReferences || 0}</div>
                            <div className="text-sm text-muted-foreground">Unprocessed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{stats?.exactMatches || 0}</div>
                            <div className="text-sm text-muted-foreground">DB Exact Matches</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{stats?.containsMatches || 0}</div>
                            <div className="text-sm text-muted-foreground">DB Contains Matches</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Current Progress Details */}
            {progress && (progress.processed > 0 || progress.errors.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Current Session Results
                        </CardTitle>
                        <CardDescription>
                            Results from the current processing session
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{progress.exactMatches}</div>
                                <div className="text-sm text-muted-foreground">Exact Matches</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{progress.containsMatches}</div>
                                <div className="text-sm text-muted-foreground">Contains Matches</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{progress.updatedRecords}</div>
                                <div className="text-sm text-muted-foreground">Updated Records</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{progress.createdReferences}</div>
                                <div className="text-sm text-muted-foreground">New References</div>
                            </div>
                        </div>

                        {/* Errors */}
                        {progress.errors.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Errors ({progress.errors.length})</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowErrors(!showErrors)}
                                    >
                                        {showErrors ? 'Hide' : 'Show'} Details
                                    </Button>
                                </div>
                                
                                {showErrors && (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {progress.errors.map((error, index) => (
                                            <Alert key={index} variant="destructive">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                    <div className="text-sm">
                                                        {error.error}
                                                        {error.file && (
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                File: {error.file}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            {new Date(error.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 