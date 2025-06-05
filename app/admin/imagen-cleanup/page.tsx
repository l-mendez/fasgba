"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Scan, Trash2, AlertTriangle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface OrphanedItem {
  id: number
  title: string
  orphanedPaths: string[]
}

interface ScanResult {
  orphanedItems: OrphanedItem[]
  validItems: Array<{ id: number; title: string }>
  totalScanned: number
  orphanedCount: number
  validCount: number
}

interface CleanupResult {
  cleanupResults: Array<{
    newsId: number
    success: boolean
    changes?: string[]
    error?: string
  }>
  totalProcessed: number
  successfulCleanups: number
  failedCleanups: number
}

export default function ImageCleanupPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const handleScan = async () => {
    setIsScanning(true)
    setCleanupResult(null)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/admin/cleanup-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'scan' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to scan images')
      }

      const result = await response.json()
      setScanResult(result)
      setSelectedItems(result.orphanedItems.map((item: OrphanedItem) => item.id))
      
      toast.success(`Scan completed! Found ${result.orphanedCount} items with orphaned images`)
    } catch (error) {
      console.error('Error scanning images:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to scan images')
    } finally {
      setIsScanning(false)
    }
  }

  const handleCleanup = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to clean up')
      return
    }

    setIsCleaning(true)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/admin/cleanup-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          action: 'cleanup',
          newsIds: selectedItems
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cleanup images')
      }

      const result = await response.json()
      setCleanupResult(result)
      
      toast.success(`Cleanup completed! ${result.successfulCleanups} items cleaned successfully`)
      
      // Refresh scan results
      setTimeout(() => {
        handleScan()
      }, 1000)
    } catch (error) {
      console.error('Error cleaning up images:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cleanup images')
    } finally {
      setIsCleaning(false)
    }
  }

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const selectAll = () => {
    if (scanResult) {
      setSelectedItems(scanResult.orphanedItems.map(item => item.id))
    }
  }

  const selectNone = () => {
    setSelectedItems([])
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-terracotta">Image Cleanup</h1>
        <p className="text-muted-foreground">Scan for and clean up orphaned image references in news items.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan for Orphaned Images</CardTitle>
          <CardDescription>
            This will check all news items for image references that point to deleted files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleScan} 
            disabled={isScanning}
            className="w-full sm:w-auto"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="mr-2 h-4 w-4" />
                Start Scan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
            <CardDescription>
              Found {scanResult.orphanedCount} news items with orphaned image references out of {scanResult.totalScanned} total items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 text-sm">
              <Badge variant="destructive">{scanResult.orphanedCount} Orphaned</Badge>
              <Badge variant="secondary">{scanResult.validCount} Valid</Badge>
            </div>

            {scanResult.orphanedCount > 0 && (
              <>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectNone}>
                    Select None
                  </Button>
                  <Button 
                    onClick={handleCleanup} 
                    disabled={isCleaning || selectedItems.length === 0}
                    variant="destructive"
                    size="sm"
                  >
                    {isCleaning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cleaning...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clean Selected ({selectedItems.length})
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scanResult.orphanedItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedItems.includes(item.id) 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Orphaned paths:</p>
                            {item.orphanedPaths.map((path, index) => (
                              <code key={index} className="block text-xs bg-gray-100 p-1 rounded mb-1">
                                {path}
                              </code>
                            ))}
                          </div>
                        </div>
                        <div className="ml-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            className="h-4 w-4"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {scanResult.orphanedCount === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No orphaned image references found. All news items have valid images!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {cleanupResult && (
        <Card>
          <CardHeader>
            <CardTitle>Cleanup Results</CardTitle>
            <CardDescription>
              Processed {cleanupResult.totalProcessed} items. {cleanupResult.successfulCleanups} successful, {cleanupResult.failedCleanups} failed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cleanupResult.cleanupResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-2 border rounded ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">News ID: {result.newsId}</span>
                    {result.success ? (
                      <Badge variant="secondary">✓ Success</Badge>
                    ) : (
                      <Badge variant="destructive">✗ Failed</Badge>
                    )}
                  </div>
                  {result.changes && result.changes.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Changes: {result.changes.join(', ')}
                    </p>
                  )}
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> The cleanup process will remove orphaned image references from the database. 
          For featured images, they will be set to null. For content block images, the entire image blocks will be removed.
          This action cannot be undone, so please review the scan results carefully before proceeding.
        </AlertDescription>
      </Alert>
    </div>
  )
} 