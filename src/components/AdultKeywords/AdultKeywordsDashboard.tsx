import React, { useState, useEffect } from 'react';
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
    const [isProcessing, setIsProcessing] = useState(false);
    
    const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useAdultKeywordsProgress(isPollingEnabled);
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdultKeywordsStats();
    
    const startMatching = useStartAdultKeywordsMatching();
    const stopMatching = useStopAdultKeywordsMatching();

    // Calculate derived states
    const isLoading = progressLoading || statsLoading;
    const isRunning = progress?.isRunning || false;
    const isComplete = progress?.isComplete || false;
    const showProgress = isProcessing || isRunning || (progress && progress.total > 0);

    // Enable polling when processing starts
    const handleStartMatching = async () => {
        try {
            setIsProcessing(true);
            setIsPollingEnabled(true);
            
            await startMatching.mutateAsync();
            await refetchProgress();
            
        } catch (error) {
            console.error('Failed to start matching:', error);
            setIsProcessing(false);
            setIsPollingEnabled(false);
        }
    };

    const handleStopMatching = async () => {
        try {
            setIsProcessing(false);
            await stopMatching.mutateAsync();
            
            setTimeout(() => {
                setIsPollingEnabled(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to stop matching:', error);
            setIsProcessing(false);
            setIsPollingEnabled(false);
        }
    };

    // Manual refresh function
    const handleManualRefresh = () => {
        refetchProgress();
        refetchStats();
    };

    // Auto-disable polling when processing completes
    useEffect(() => {
        if (progress && (progress.isComplete || !progress.isRunning)) {
            const timer = setTimeout(() => {
                setIsPollingEnabled(false);
                setIsProcessing(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [progress]);

    // Reset processing state when progress changes
    useEffect(() => {
        if (progress) {
            if (progress.isComplete || !progress.isRunning) {
                setIsProcessing(false);
            } else if (progress.isRunning) {
                setIsProcessing(true);
            }
        }
    }, [progress]);

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
                        disabled={isProcessing || isRunning || startMatching.isPending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        {startMatching.isPending ? 'Starting...' : 
                         isProcessing ? 'Processing...' : 'Start Matching'}
                    </Button>
                    
                    <Button
                        onClick={handleStopMatching}
                        disabled={!isProcessing && !isRunning || stopMatching.isPending}
                        variant="destructive"
                    >
                        <Square className="mr-2 h-4 w-4" />
                        {stopMatching.isPending ? 'Stopping...' : 'Stop Matching'}
                    </Button>

                    <Button
                        onClick={handleManualRefresh}
                        disabled={progressLoading || isProcessing}
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
                                variant={isProcessing || isRunning ? "default" : isComplete ? "secondary" : "outline"}
                                className={getStatusColor(progress || { isRunning: false, isComplete: false } as AdultKeywordsProgress)}
                            >
                                {isProcessing && !progress?.isRunning ? 'Starting...' : 
                                 getStatusText(progress || { isRunning: false, isComplete: false } as AdultKeywordsProgress)}
                            </Badge>
                            {progress?.currentFile && (
                                <span className="text-sm text-muted-foreground">
                                    {progress.currentFile}
                                </span>
                            )}
                            <Badge variant="outline" className="text-xs">
                                {isPollingEnabled ? '🔄 Live Updates' : '⏸️ Updates Paused'}
                            </Badge>
                        </div>
                        
                        {showProgress && progress && progress.total > 0 && (
                            <span className="text-sm text-muted-foreground">
                                {progress.processed} / {progress.total} records
                            </span>
                        )}
                    </div>

                    {showProgress && progress && progress.total > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{getProgressPercentage(progress)}%</span>
                            </div>
                            <Progress value={getProgressPercentage(progress)} className="h-2" />
                        </div>
                    )}

                    {isProcessing && (!progress || progress.total === 0) && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Initializing...</span>
                                <span>0%</span>
                            </div>
                            <Progress value={0} className="h-2" />
                            <div className="text-xs text-muted-foreground text-center">
                                Starting adult keywords matching process...
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Live Progress Statistics */}
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
                            disabled={progressLoading || isProcessing}
                        >
                            <RefreshCw className={`h-3 w-3 ${progressLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardDescription>
                    {progress?.currentFile && (
                        <div className="text-sm text-muted-foreground">
                            Currently processing: <span className="font-mono">{progress.currentFile}</span>
                        </div>
                    )}
                    {isProcessing && !progress?.currentFile && (
                        <div className="text-sm text-muted-foreground">
                            Initializing process...
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isProcessing && !progress?.total ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            Loading...
                                        </div>
                                    ) : (
                                        progress?.total || 0
                                    )}
                                </div>
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
                                <div className="text-2xl font-bold">
                                    {isProcessing && !progress?.processed ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            Loading...
                                        </div>
                                    ) : (
                                        progress?.processed || 0
                                    )}
                                </div>
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
                                <div className="text-2xl font-bold">
                                    {isProcessing && !progress?.exactMatches ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            Loading...
                                        </div>
                                    ) : (
                                        progress?.exactMatches || 0
                                    )}
                                </div>
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
                                <div className="text-2xl font-bold">
                                    {isProcessing && !progress?.containsMatches ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            Loading...
                                        </div>
                                    ) : (
                                        progress?.containsMatches || 0
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Partial keyword matches found
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            {/* Processing Summary */}
            {progress && progress.isComplete && (progress.processed > 0 || progress.errors.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Processing Summary
                        </CardTitle>
                        <CardDescription>
                            Final results from the completed processing session
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