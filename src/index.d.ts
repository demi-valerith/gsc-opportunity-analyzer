export type Dimension = "query" | "page";
export type OpportunityKind =
  | "striking_distance"
  | "low_ctr"
  | "rising"
  | "decay"
  | "page_opportunity";
export type Confidence = "high" | "medium" | "low";
export type OutputFormat = "markdown" | "md" | "json" | "csv";

export interface MetricRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface Opportunity {
  kind: OpportunityKind;
  label: string;
  dimension: Dimension;
  subject: string;
  score: number;
  confidence: Confidence;
  evidence: string;
  action: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface AnalyzeOptions {
  current: MetricRow[];
  previous?: MetricRow[];
  pages?: MetricRow[];
  minimumImpressions?: number;
  strikingDistance?: [number, number];
}

export interface AnalyzeFilesOptions {
  currentPath: string;
  previousPath?: string;
  pagesPath?: string;
  minimumImpressions?: number;
  strikingDistance?: [number, number];
}

export const RULES_VERSION: string;
export const KIND_LABELS: Record<OpportunityKind, string>;

export function parseMetricCsv(input: string, dimension?: Dimension): MetricRow[];
export function analyzeOpportunities(options: AnalyzeOptions): Opportunity[];
export function analyzeFiles(options: AnalyzeFilesOptions): Promise<Opportunity[]>;
export function formatFindings(findings: Opportunity[], format?: OutputFormat): string;
export function toMarkdown(findings: Opportunity[]): string;
export function toJson(findings: Opportunity[]): string;
export function toCsv(findings: Opportunity[]): string;
