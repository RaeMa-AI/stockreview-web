import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 md:p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Search Bar Skeleton */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 flex-grow" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Stock List Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>我的股票</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stock Detail Page Skeleton (if applicable, for /stock/[symbol] route) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-8 w-20" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
