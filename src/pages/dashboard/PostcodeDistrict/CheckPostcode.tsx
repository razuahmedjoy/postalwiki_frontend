import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Search, Copy } from 'lucide-react';
import { usePostcodeCheck, CheckPostcodesResult } from '@/api/postcodeDistrict';

const MAX_POSTCODES = 500;

const parsePostcodes = (rawText: string) => {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const CheckPostcode: React.FC = () => {
  const [rawInput, setRawInput] = useState('');
  const [result, setResult] = useState<CheckPostcodesResult | null>(null);

  const { mutateAsync: checkPostcodes, isPending } = usePostcodeCheck();

  const parsedInput = useMemo(() => parsePostcodes(rawInput), [rawInput]);
  const overLimit = parsedInput.length > MAX_POSTCODES;

  const handleCheck = async () => {
    if (!parsedInput.length) {
      toast.error('Please paste at least one postcode.');
      return;
    }

    if (overLimit) {
      toast.error(`Maximum ${MAX_POSTCODES} postcodes are allowed.`);
      return;
    }

    try {
      const data = await checkPostcodes(parsedInput);
      setResult(data);
      toast.success('Postcode check completed.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Postcode check failed';
      toast.error(message);
    }
  };

  const handleCopyMissing = async () => {
    if (!result?.missingPostcodes?.length) {
      toast.info('No missing postcodes to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(result.missingPostcodes.join('\n'));
      toast.success('Missing postcodes copied.');
    } catch {
      toast.error('Failed to copy missing postcodes.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Check Postcode</CardTitle>
          <CardDescription>
            Paste up to 500 postcodes (one per line). The system checks which are missing from postcode_district.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Postcode List</label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={'GU27 2FB\nGU27 3FD\nGU27 3FE'}
              className="min-h-[260px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={overLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
              Input rows: {parsedInput.length} / {MAX_POSTCODES}
            </span>
            {overLimit && <span className="text-red-500">Too many rows. Remove some postcodes.</span>}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCheck} disabled={isPending || parsedInput.length === 0 || overLimit}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Run Check
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Check Report</CardTitle>
            <CardDescription>Summary and missing postcode list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Input Count</p>
                <p className="text-lg font-semibold">{result.inputCount.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Unique Normalized</p>
                <p className="text-lg font-semibold">{result.uniqueCount.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Found</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{result.foundCount.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Missing</p>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{result.missingCount.toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">Missing Postcodes</h3>
                <Button variant="outline" size="sm" onClick={handleCopyMissing} disabled={!result.missingPostcodes.length}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>

              {result.missingPostcodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">All provided postcodes are available in the database.</p>
              ) : (
                <div className="max-h-[320px] overflow-y-auto rounded-md border bg-muted/20 p-3">
                  <pre className="text-xs whitespace-pre-wrap break-words">{result.missingPostcodes.join('\n')}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CheckPostcode;
