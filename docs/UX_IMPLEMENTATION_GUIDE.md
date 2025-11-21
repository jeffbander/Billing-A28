# Implementation Guide: Physician Value Dashboard Components

This guide provides code examples and implementation patterns for the new physician value dashboard components.

---

## 1. ExecutiveValueSummary Component

### Example Implementation

```tsx
// components/valuation/ExecutiveValueSummary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExecutiveValueSummaryProps {
  totalAnnualValue: number;
  earnedValue: number;
  attributedValue: number;
  facilityValue?: number;
  physicianSalary?: number;
  rvusPerMonth: number;
  referralRetentionRate?: number;
  percentileRank?: number;
  benchmarkComparison?: number;
  providerName: string;
}

export function ExecutiveValueSummary({
  totalAnnualValue,
  earnedValue,
  attributedValue,
  facilityValue = 0,
  physicianSalary,
  rvusPerMonth,
  referralRetentionRate,
  percentileRank,
  benchmarkComparison,
  providerName,
}: ExecutiveValueSummaryProps) {
  const multiplier = physicianSalary ? (totalAnnualValue / physicianSalary).toFixed(1) : null;

  const earnedPercent = (earnedValue / totalAnnualValue) * 100;
  const attributedPercent = (attributedValue / totalAnnualValue) * 100;
  const facilityPercent = (facilityValue / totalAnnualValue) * 100;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-slate-600">
          Executive Value Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Total Value */}
          <div className="flex-shrink-0">
            <div className="text-4xl font-bold text-slate-900">
              {formatCurrency(totalAnnualValue)}
            </div>
            <div className="text-sm text-slate-500 mt-1">Annual Value</div>
            {benchmarkComparison && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm font-medium",
                benchmarkComparison > 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {benchmarkComparison > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {benchmarkComparison > 0 ? "+" : ""}{benchmarkComparison}% vs peer average
              </div>
            )}
          </div>

          {/* Value Breakdown Bar */}
          <div className="flex-grow">
            <div className="text-sm font-medium text-slate-600 mb-2">Value Breakdown</div>
            <div className="h-8 rounded-full overflow-hidden flex bg-slate-200">
              <div
                className="bg-emerald-500 transition-all duration-700"
                style={{ width: `${earnedPercent}%` }}
                title={`Direct Work: ${formatCurrency(earnedValue)}`}
              />
              <div
                className="bg-blue-500 transition-all duration-700"
                style={{ width: `${attributedPercent}%` }}
                title={`Attributed: ${formatCurrency(attributedValue)}`}
              />
              {facilityValue > 0 && (
                <div
                  className="bg-purple-500 transition-all duration-700"
                  style={{ width: `${facilityPercent}%` }}
                  title={`Facility Fees: ${formatCurrency(facilityValue)}`}
                />
              )}
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Direct {earnedPercent.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Attributed {attributedPercent.toFixed(0)}%</span>
              </div>
              {facilityValue > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Facility {facilityPercent.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Insight Callout */}
        {multiplier && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 mt-0.5">💡</div>
              <div>
                <div className="font-medium text-blue-900">
                  Key Insight: {multiplier}x Return on Investment
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  For every $1 invested in {providerName}'s salary, the health system
                  receives ${multiplier} in total value through direct work AND
                  orders/referrals.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {multiplier && (
            <QuickStat
              icon={<DollarSign className="h-4 w-4" />}
              label="ROI Multiplier"
              value={`${multiplier}x`}
              color="emerald"
            />
          )}
          <QuickStat
            icon={<Activity className="h-4 w-4" />}
            label="RVUs/Month"
            value={rvusPerMonth.toFixed(1)}
            color="blue"
          />
          {referralRetentionRate !== undefined && (
            <QuickStat
              icon={<Users className="h-4 w-4" />}
              label="In-Network Referrals"
              value={`${referralRetentionRate}%`}
              color="purple"
            />
          )}
          {percentileRank !== undefined && (
            <QuickStat
              icon={<Award className="h-4 w-4" />}
              label="Ranking"
              value={`Top ${100 - percentileRank}%`}
              color="amber"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "blue" | "purple" | "amber";
}) {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className={cn(
      "rounded-lg border p-3 text-center",
      colorClasses[color]
    )}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}
```

---

## 2. ValueMultiplierCard Component

```tsx
// components/valuation/ValueMultiplierCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ValueBreakdownItem {
  label: string;
  value: number;
  color: string;
}

interface ValueMultiplierCardProps {
  multiplier: number;
  salary: number;
  totalValue: number;
  breakdown: ValueBreakdownItem[];
  benchmark?: number;
}

export function ValueMultiplierCard({
  multiplier,
  salary,
  totalValue,
  breakdown,
  benchmark,
}: ValueMultiplierCardProps) {
  const [animatedMultiplier, setAnimatedMultiplier] = useState(0);

  // Animate the multiplier on mount
  useEffect(() => {
    const duration = 800;
    const steps = 60;
    const increment = multiplier / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= multiplier) {
        setAnimatedMultiplier(multiplier);
        clearInterval(timer);
      } else {
        setAnimatedMultiplier(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [multiplier]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const totalBreakdown = breakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg text-emerald-800">
          Value Multiplier Effect
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hero Multiplier Display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-emerald-600">
            $1 → ${animatedMultiplier.toFixed(2)}
          </div>
          <div className="text-sm text-emerald-700 mt-2">
            For every dollar invested in salary, the health system receives{" "}
            <span className="font-bold">${multiplier.toFixed(2)}</span> in total value
          </div>
        </div>

        {/* Breakdown Visualization */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-600">How value accumulates:</div>
          <div className="flex gap-1 h-12 rounded-lg overflow-hidden">
            {breakdown.map((item, index) => (
              <div
                key={item.label}
                className="flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
                style={{
                  backgroundColor: item.color,
                  width: `${(item.value / totalBreakdown) * 100}%`,
                }}
                title={`${item.label}: ${formatCurrency(item.value)}`}
              >
                {(item.value / totalBreakdown) * 100 > 10 && (
                  <span>${(item.value / salary).toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark Comparison */}
        {benchmark && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Industry benchmark:</span>
              <span className="font-medium">{benchmark.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-slate-600">This physician:</span>
              <span className={cn(
                "font-bold",
                multiplier > benchmark ? "text-emerald-600" : "text-amber-600"
              )}>
                {multiplier.toFixed(1)}x
                {multiplier > benchmark && (
                  <span className="ml-2 text-emerald-500">
                    ▲ +{((multiplier - benchmark) / benchmark * 100).toFixed(0)}%
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 3. Article28ImpactCard Component

```tsx
// components/valuation/Article28ImpactCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Article28ImpactCardProps {
  siteType: "Article28" | "FPA";
  siteName: string;
  currentRevenue: number;
  alternativeRevenue: number;
  showComparison?: boolean;
}

export function Article28ImpactCard({
  siteType,
  siteName,
  currentRevenue,
  alternativeRevenue,
  showComparison = true,
}: Article28ImpactCardProps) {
  const isArticle28 = siteType === "Article28";
  const difference = currentRevenue - alternativeRevenue;
  const percentDifference = alternativeRevenue > 0
    ? ((difference / alternativeRevenue) * 100).toFixed(0)
    : "N/A";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const maxRevenue = Math.max(currentRevenue, alternativeRevenue);

  return (
    <Card className={cn(
      "border-2",
      isArticle28 ? "border-purple-200 bg-purple-50/30" : "border-slate-200"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className={cn(
              "h-5 w-5",
              isArticle28 ? "text-purple-600" : "text-slate-500"
            )} />
            {isArticle28 ? "Article 28 Advantage" : "Site Impact Analysis"}
          </CardTitle>
          <Badge variant={isArticle28 ? "default" : "secondary"}>
            {siteType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Site Info */}
        <div>
          <div className="text-sm text-slate-500">Current Site</div>
          <div className="font-medium">{siteName}</div>
        </div>

        {/* Revenue Comparison */}
        {showComparison && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-600">
              Same procedures, different value:
            </div>

            {/* FPA Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={!isArticle28 ? "font-medium" : ""}>
                  {isArticle28 ? "At FPA Site" : "At this FPA Site"}
                </span>
                <span>{formatCurrency(isArticle28 ? alternativeRevenue : currentRevenue)}</span>
              </div>
              <div className="h-6 bg-slate-200 rounded overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    !isArticle28 ? "bg-slate-500" : "bg-slate-400"
                  )}
                  style={{
                    width: `${((isArticle28 ? alternativeRevenue : currentRevenue) / maxRevenue) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Article 28 Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={isArticle28 ? "font-medium" : ""}>
                  {isArticle28 ? "At this Article 28 Site" : "At Article 28 Site"}
                </span>
                <span>{formatCurrency(isArticle28 ? currentRevenue : alternativeRevenue)}</span>
              </div>
              <div className="h-6 bg-purple-100 rounded overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 bg-purple-500"
                  )}
                  style={{
                    width: `${((isArticle28 ? currentRevenue : alternativeRevenue) / maxRevenue) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Difference Callout */}
            {isArticle28 && difference > 0 && (
              <div className="bg-purple-100 rounded-lg p-3 text-center">
                <div className="text-sm text-purple-700">Additional Value from Article 28</div>
                <div className="text-2xl font-bold text-purple-800">
                  +{formatCurrency(difference)}
                </div>
                <div className="text-sm text-purple-600">+{percentDifference}%</div>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        <div className="text-sm text-slate-600 pt-2 border-t">
          {isArticle28 ? (
            <>
              Article 28 sites (hospital outpatient departments) can bill facility fees
              that would not be available at a private practice location.
            </>
          ) : (
            <>
              Moving this provider to an Article 28 site could unlock significant
              additional facility fee revenue.
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 4. ValueStoryCard Component

```tsx
// components/valuation/ValueStoryCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface ValueStoryPoint {
  emoji: string;
  title: string;
  description: string;
  impact: string;
}

interface ValueStoryCardProps {
  providerName: string;
  institutionName: string;
  storyPoints: ValueStoryPoint[];
}

export function ValueStoryCard({
  providerName,
  institutionName,
  storyPoints,
}: ValueStoryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          The Value Story
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-slate-600">
          <span className="font-medium">{providerName}'s</span> Impact on{" "}
          <span className="font-medium">{institutionName}</span>
        </div>

        <div className="space-y-4">
          {storyPoints.map((point, index) => (
            <div
              key={index}
              className="flex gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="text-2xl">{point.emoji}</div>
              <div className="flex-grow">
                <div className="font-medium text-slate-800">{point.title}</div>
                <div className="text-sm text-slate-600 mt-1">{point.description}</div>
                <div className="text-sm font-medium text-emerald-600 mt-2">
                  → {point.impact}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage:
// <ValueStoryCard
//   providerName="Dr. Chen"
//   institutionName="Memorial Health System"
//   storyPoints={[
//     {
//       emoji: "📊",
//       title: "High-Volume Ordering Physician",
//       description: "Orders 150 imaging studies monthly that other specialists read",
//       impact: "Generates $1.08M in technical revenue for the system"
//     },
//     {
//       emoji: "🏥",
//       title: "Article 28 Site Location",
//       description: "Practices at Memorial Cardiac Center, unlocking facility fees",
//       impact: "Each procedure generates fees unavailable at FPA sites"
//     },
//     {
//       emoji: "🔗",
//       title: "Strong Referral Retention",
//       description: "Keeps 89% of referrals within the network",
//       impact: "Retaining $423K in downstream specialist revenue"
//     }
//   ]}
// />
```

---

## 5. ComparisonWinnerHighlight Component

```tsx
// components/valuation/ComparisonWinnerHighlight.tsx
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface ComparisonWinnerHighlightProps {
  isWinner: boolean;
  percentageAdvantage?: number;
  className?: string;
}

export function ComparisonWinnerHighlight({
  isWinner,
  percentageAdvantage,
  className,
}: ComparisonWinnerHighlightProps) {
  if (!isWinner) return null;

  return (
    <div className={cn(
      "inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium",
      className
    )}>
      <Trophy className="h-4 w-4" />
      <span>WINNER</span>
      {percentageAdvantage && percentageAdvantage > 0 && (
        <span className="text-amber-600">+{percentageAdvantage.toFixed(0)}%</span>
      )}
    </div>
  );
}
```

---

## 6. Enhanced Activity Table with Value Column

```tsx
// Enhancement to existing activity breakdown table

interface ActivityRowProps {
  cptCode: string;
  description: string;
  procedureType: "imaging" | "visit" | "procedure";
  monthlyOrders: number;
  monthlyReads: number;
  monthlyPerforms: number;
  earnedProfRvus: number;
  earnedProfRevenue: number;
  earnedTechRevenue: number;
  attributedRevenue?: number;
  isHighValue?: boolean;
}

function ActivityTableRow({
  cptCode,
  description,
  procedureType,
  monthlyOrders,
  monthlyReads,
  monthlyPerforms,
  earnedProfRvus,
  earnedProfRevenue,
  earnedTechRevenue,
  attributedRevenue,
  isHighValue,
}: ActivityRowProps) {
  const totalValue = earnedProfRevenue + earnedTechRevenue + (attributedRevenue || 0);

  return (
    <TableRow className={cn(isHighValue && "bg-emerald-50")}>
      <TableCell className="font-medium">
        {cptCode}
        {isHighValue && <span className="ml-2 text-emerald-600">⬆</span>}
      </TableCell>
      <TableCell>{description}</TableCell>
      <TableCell className="text-right">
        {procedureType === "imaging" ? monthlyOrders : "-"}
      </TableCell>
      <TableCell className="text-right">
        {procedureType === "imaging" ? monthlyReads : "-"}
      </TableCell>
      <TableCell className="text-right">
        {procedureType !== "imaging" ? monthlyPerforms : "-"}
      </TableCell>
      <TableCell className="text-right font-medium">
        {earnedProfRvus.toFixed(2)}
      </TableCell>
      <TableCell className="text-right text-emerald-600">
        {formatCurrency(earnedProfRevenue)}
      </TableCell>
      <TableCell className="text-right text-blue-600">
        {formatCurrency(earnedTechRevenue)}
      </TableCell>
      {/* NEW: Total Value Column */}
      <TableCell className="text-right font-bold">
        {formatCurrency(totalValue)}
        {attributedRevenue && attributedRevenue > 0 && (
          <div className="text-xs text-slate-500 font-normal">
            (includes ${attributedRevenue.toLocaleString()} attributed)
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
```

---

## 7. Utility Functions

```typescript
// lib/valuation-utils.ts

export function calculateMultiplier(
  totalValue: number,
  salary: number
): number {
  if (salary <= 0) return 0;
  return totalValue / salary;
}

export function calculateValueBreakdown(
  earnedProfRevenue: number,
  earnedTechRevenue: number,
  attributedProfRevenue: number,
  attributedTechRevenue: number
) {
  const total = earnedProfRevenue + earnedTechRevenue + attributedProfRevenue + attributedTechRevenue;

  return {
    total,
    earned: earnedProfRevenue + earnedTechRevenue,
    attributed: attributedProfRevenue + attributedTechRevenue,
    breakdown: [
      { label: "Direct Professional", value: earnedProfRevenue, color: "#10B981" },
      { label: "Direct Technical", value: earnedTechRevenue, color: "#059669" },
      { label: "Attributed Professional", value: attributedProfRevenue, color: "#3B82F6" },
      { label: "Attributed Technical", value: attributedTechRevenue, color: "#2563EB" },
    ],
  };
}

export function generateValueStoryPoints(
  summary: any,
  activityResults: any[],
  site: any
): { emoji: string; title: string; description: string; impact: string }[] {
  const points = [];

  // Check for high-volume ordering
  const totalOrders = activityResults.reduce((sum, a) => sum + (a.monthlyOrders || 0), 0);
  if (totalOrders > 0) {
    points.push({
      emoji: "📊",
      title: "Ordering Physician",
      description: `Orders ${totalOrders} studies monthly that other specialists perform`,
      impact: `Generates ${formatCurrency(summary.attributedTechnicalRevenue * 12)} annually in attributed revenue`,
    });
  }

  // Check for Article 28 site
  if (site?.siteType === "Article28") {
    points.push({
      emoji: "🏥",
      title: "Article 28 Site Location",
      description: `Practices at ${site.name}, unlocking facility fees`,
      impact: "Each procedure generates facility fees unavailable at FPA sites",
    });
  }

  // Add productivity point
  if (summary.earnedProfessionalRvus > 0) {
    points.push({
      emoji: "⚡",
      title: "Clinical Productivity",
      description: `Generates ${summary.earnedProfessionalRvus.toFixed(1)} RVUs monthly through direct clinical work`,
      impact: `${formatCurrency(summary.earnedProfessionalRevenue * 12)} in annual professional fees`,
    });
  }

  return points;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
```

---

## 8. API Enhancement Suggestions

```typescript
// server/routers/valuations.ts - Suggested additions

// Add executive summary endpoint
executiveSummary: publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ ctx, input }) => {
    const results = await calculateValuation(ctx, input.id);

    // Get benchmark data
    const benchmarks = await ctx.db.query.valuations.findMany({
      // ... get comparable valuations
    });

    const avgMultiplier = benchmarks.reduce((sum, v) =>
      sum + calculateMultiplier(v.totalValue, v.salary), 0) / benchmarks.length;

    return {
      totalAnnualValue: (results.summary.earnedProfessionalRevenue +
                        results.summary.earnedTechnicalRevenue +
                        results.summary.attributedProfessionalRevenue +
                        results.summary.attributedTechnicalRevenue) * 12,
      earnedValue: (results.summary.earnedProfessionalRevenue +
                   results.summary.earnedTechnicalRevenue) * 12,
      attributedValue: (results.summary.attributedProfessionalRevenue +
                       results.summary.attributedTechnicalRevenue) * 12,
      multiplier: calculateMultiplier(totalAnnualValue, results.provider.salary),
      benchmarkMultiplier: avgMultiplier,
      percentileRank: calculatePercentile(results, benchmarks),
      insights: generateInsights(results),
    };
  }),

// Add portfolio overview endpoint
portfolioOverview: publicProcedure
  .query(async ({ ctx }) => {
    const allValuations = await ctx.db.query.valuations.findMany({
      with: { provider: true, site: true },
    });

    // Calculate and aggregate all metrics
    const calculated = await Promise.all(
      allValuations.map(v => calculateValuation(ctx, v.id))
    );

    return {
      totalSystemValue: calculated.reduce((sum, v) => sum + v.totalAnnualValue, 0),
      avgMultiplier: calculated.reduce((sum, v) => sum + v.multiplier, 0) / calculated.length,
      attributionRatio: calculateAttributionRatio(calculated),
      providers: calculated.map(v => ({
        id: v.provider.id,
        name: v.provider.name,
        specialty: v.provider.specialty,
        totalValue: v.totalAnnualValue,
        multiplier: v.multiplier,
        trend: calculateTrend(v),
      })).sort((a, b) => b.totalValue - a.totalValue),
      siteAnalysis: aggregateBySiteType(calculated),
      attentionNeeded: findAttentionNeeded(calculated),
    };
  }),
```

---

## 9. Testing Checklist

### Component Tests
- [ ] ExecutiveValueSummary renders with all props
- [ ] ValueMultiplierCard animates correctly
- [ ] Article28ImpactCard handles both site types
- [ ] ValueStoryCard renders dynamic content
- [ ] ComparisonWinnerHighlight shows/hides correctly

### Integration Tests
- [ ] ValuationResults page loads with new components
- [ ] Comparison page highlights winner correctly
- [ ] Portfolio overview aggregates data correctly

### Visual Tests
- [ ] All components responsive at breakpoints
- [ ] Colors meet accessibility contrast requirements
- [ ] Animations respect prefers-reduced-motion

---

*Document Version: 1.0*
*Last Updated: 2025-11-21*
