import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Activity,
    FileText,
    Settings,
    Database,
    AlertTriangle
} from 'lucide-react';
import { AdultKeywordsDashboard } from '@/components/AdultKeywords/AdultKeywordsDashboard';
import { AdultKeywordsReferencesTable } from '@/components/AdultKeywords/AdultKeywordsReferencesTable';

const MatchAdultKeywordsPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="w-full mx-auto p-4 space-y-4">
            {/* Page Header */}

            <h1 className="text-2xl font-bold tracking-tight">Adult Keywords Management</h1>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="references" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Manual Review
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    <AdultKeywordsDashboard />
                </TabsContent>

                {/* References Tab */}
                <TabsContent value="references" className="space-y-6">
                    <AdultKeywordsReferencesTable />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Configuration & Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Directory Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Database className="h-4 w-4" />
                                            CSV Directory
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            CSV files should be placed in:
                                        </p>
                                        <code className="block bg-muted p-2 rounded text-sm font-mono">
                                            server/update/social_scrape/match_adult_keywords/
                                        </code>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Files will be automatically moved to a completed folder after processing.
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Process Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            Process Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <strong>Exact Matches:</strong> URLs with exact keyword matches are automatically updated in the social scrape database.
                                            </div>
                                            <div>
                                                <strong>Contains Matches:</strong> URLs with partial keyword matches are flagged for manual review.
                                            </div>
                                            <div>
                                                <strong>Batch Processing:</strong> Files are processed in batches of 1000 records for optimal performance.
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* How It Works */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">How It Works</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 text-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">
                                                    1
                                                </div>
                                                <h4 className="font-medium">Upload CSV Files</h4>
                                                <p className="text-muted-foreground">
                                                    Place CSV files in the designated directory
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <div className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">
                                                    2
                                                </div>
                                                <h4 className="font-medium">Start Matching</h4>
                                                <p className="text-muted-foreground">
                                                    Click "Start Matching" to begin processing
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <div className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">
                                                    3
                                                </div>
                                                <h4 className="font-medium">Review Results</h4>
                                                <p className="text-muted-foreground">
                                                    Check the References tab for items requiring review
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MatchAdultKeywordsPage;