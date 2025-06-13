
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
      </div>

      {/* Analytics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="content-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-2 w-full bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversations Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="content-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-3/4 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tutor Selection Skeleton */}
      <Card className="content-card">
        <CardContent className="p-6">
          <div className="h-6 w-48 bg-muted rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-5 w-8 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="h-3 w-full bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-3 w-3/4 bg-muted rounded animate-pulse mb-3"></div>
                <div className="h-9 w-full bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
