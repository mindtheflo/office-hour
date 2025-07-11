import { Card, CardContent } from "@/components/ui/card"

export function LoadingSkeleton() {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-md w-3/4 mx-auto animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded-md w-1/2 mx-auto animate-pulse"></div>
      </div>
      <Card className="shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded-md w-1/3 mx-auto animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-md w-2/3 mx-auto animate-pulse"></div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>

          <div className="h-10 bg-gray-200 rounded-md w-full animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-md w-full animate-pulse"></div>
        </CardContent>
      </Card>
    </div>
  )
}
