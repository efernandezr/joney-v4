import { accessFilter } from "@agent-native/core/sharing";
import {
  and,
  eq,
  exists,
  isNotNull,
  isNull,
  notExists,
  or,
  type SQL,
} from "drizzle-orm";

import { getDb, schema } from "../server/db/index.js";
import { documentDiscoveryFilter } from "../server/lib/documents.js";

export const DOCUMENT_DISCOVERY_MAX_LIMIT = 200;
export const DOCUMENT_DISCOVERY_DEFAULT_LIMIT = 50;

export type DocumentDiscoveryType = "page" | "database";

export interface DocumentDiscoveryFilters {
  userEmail: string | null | undefined;
  authorizedOrgIds: string[];
  exactTitle?: string;
  parentId?: string | null;
  spaceId?: string;
  documentType?: DocumentDiscoveryType;
  additional?: SQL;
}

/**
 * Agent tool calls arrive with placeholder values in optional filter fields:
 * some models cannot leave an optional parameter unset and fill it with a
 * sentinel like ".", ",", "all", or "any" (observed with GPT-5.6 Luna; the
 * guard is model-agnostic). A placeholder that reaches SQL filters every row
 * out and the agent wrongly concludes the content does not exist. Normalize
 * placeholders to "unset" at the schema boundary so agent calls, HTTP calls,
 * and any future model behave identically. Real ids are never shaped like
 * these sentinels, and "all"/"any"/"*" read as an explicit no-filter request.
 */
const ID_FILTER_PLACEHOLDERS = new Set([
  "",
  ".",
  ",",
  "*",
  "-",
  "all",
  "any",
  "none",
  "null",
  "undefined",
  "n/a",
]);

// Titles are free-form user text, so only reject values that cannot be a
// real title: empty and bare punctuation. Words like "null" or "N/A" stay —
// a page could genuinely carry that name.
const TITLE_FILTER_PLACEHOLDERS = new Set(["", ".", ",", "*", "-"]);

export function normalizedIdFilter(
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return ID_FILTER_PLACEHOLDERS.has(trimmed.toLowerCase())
    ? undefined
    : trimmed;
}

export function normalizedTitleFilter(
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return TITLE_FILTER_PLACEHOLDERS.has(trimmed) ? undefined : trimmed;
}

export function normalizedParentIdFilter(
  value: string | null | undefined,
): string | null | undefined {
  // `null` keeps its documented meaning (top-level documents only); only
  // placeholder strings collapse to "no parent filter".
  if (typeof value !== "string") return value;
  return normalizedIdFilter(value);
}

export function documentDiscoveryWhere({
  userEmail,
  authorizedOrgIds,
  exactTitle,
  parentId,
  spaceId,
  documentType,
  additional,
}: DocumentDiscoveryFilters) {
  const db = getDb();
  const accessContexts = [
    { userEmail: userEmail ?? undefined },
    ...authorizedOrgIds.map((orgId) => ({
      userEmail: userEmail ?? undefined,
      orgId,
    })),
  ];
  const activeDatabaseDocument = db
    .select({ id: schema.contentDatabases.id })
    .from(schema.contentDatabases)
    .where(
      and(
        eq(schema.contentDatabases.documentId, schema.documents.id),
        isNull(schema.contentDatabases.deletedAt),
      ),
    );
  const deletedDatabaseDocument = db
    .select({ id: schema.contentDatabases.id })
    .from(schema.contentDatabases)
    .where(
      and(
        eq(schema.contentDatabases.documentId, schema.documents.id),
        isNotNull(schema.contentDatabases.deletedAt),
      ),
    );
  const deletedDatabaseMembership = db
    .select({ id: schema.contentDatabaseItems.id })
    .from(schema.contentDatabaseItems)
    .innerJoin(
      schema.contentDatabases,
      eq(schema.contentDatabases.id, schema.contentDatabaseItems.databaseId),
    )
    .where(
      and(
        eq(schema.contentDatabaseItems.documentId, schema.documents.id),
        isNotNull(schema.contentDatabases.deletedAt),
      ),
    );

  return and(
    or(
      ...accessContexts.map((context) =>
        accessFilter(schema.documents, schema.documentShares, context),
      ),
    ),
    isNull(schema.documents.trashedAt),
    documentDiscoveryFilter({
      userEmail,
      orgIds: authorizedOrgIds,
    }),
    notExists(deletedDatabaseDocument),
    notExists(deletedDatabaseMembership),
    exactTitle === undefined
      ? undefined
      : eq(schema.documents.title, exactTitle),
    parentId === undefined
      ? undefined
      : parentId === null
        ? isNull(schema.documents.parentId)
        : eq(schema.documents.parentId, parentId),
    spaceId === undefined ? undefined : eq(schema.documents.spaceId, spaceId),
    documentType === "database"
      ? exists(activeDatabaseDocument)
      : documentType === "page"
        ? notExists(activeDatabaseDocument)
        : undefined,
    additional,
  );
}

export function documentDiscoveryPagination(args: {
  offset: number;
  limit: number;
  totalItems: number;
  returnedItems: number;
}) {
  const nextOffset = args.offset + args.returnedItems;
  const hasMore = nextOffset < args.totalItems;
  return {
    offset: args.offset,
    limit: args.limit,
    totalItems: args.totalItems,
    returnedItems: args.returnedItems,
    hasMore,
    nextOffset: hasMore ? nextOffset : null,
  };
}
