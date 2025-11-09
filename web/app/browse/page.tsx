import { headers } from "next/headers"

import { ToyotaFooter } from "@/components/layout/toyota-footer"
import BrowseClient from "./BrowseClient"

import type { CarsResponse } from "@/lib/supabase/types"

const DEFAULT_PAGE = "1"
const DEFAULT_PAGE_SIZE = "12"

type SearchParamsValue = Record<string, string | string[] | undefined>
type BrowsePageProps = {
  searchParams?: SearchParamsValue | Promise<SearchParamsValue>
}

export const revalidate = 0

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams)
  const initialParams = buildInitialParams(resolvedSearchParams)

  if (!initialParams.page) {
    initialParams.page = DEFAULT_PAGE
  }

  if (!initialParams.page_size) {
    initialParams.page_size = DEFAULT_PAGE_SIZE
  }

  const initialData = await fetchInitialCars(initialParams)

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <div className="flex-1 space-y-16 pb-24">
        <BrowseClient initialItems={initialData.items} initialMeta={initialData.meta} initialParams={initialParams} />
      </div>
      <ToyotaFooter />
    </div>
  )
}

function buildInitialParams(source?: SearchParamsValue) {
  const result: Record<string, string> = {}

  if (!source) {
    return result
  }

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        result[key] = value[value.length - 1] ?? ""
      }
    } else if (typeof value === "string") {
      result[key] = value
    }
  }

  return result
}

async function fetchInitialCars(params: Record<string, string>) {
  const query = new URLSearchParams(params)
  const baseUrl = await resolveBaseUrl()

  try {
    const response = await fetch(`${baseUrl}/api/cars?${query.toString()}`, {
      cache: "no-store",
      headers: {
        "x-internal-fetch": "browse-page",
      },
    })

    if (!response.ok) {
      console.error("[browse/page] Failed to fetch cars:", response.status, response.statusText)
      return defaultCarsResponse(params)
    }

    const data = (await response.json()) as CarsResponse

    return {
      items: data.items ?? [],
      meta: {
        page: data.page ?? Number(params.page ?? DEFAULT_PAGE),
        pageSize: data.pageSize ?? Number(params.page_size ?? DEFAULT_PAGE_SIZE),
        total: data.total ?? data.items?.length ?? 0,
        totalPages: data.totalPages ?? 1,
      },
    }
  } catch (error) {
    console.error("[browse/page] Unexpected error fetching cars:", error)
    return defaultCarsResponse(params)
  }
}

async function resolveBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }

  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  const protocol = headerList.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https")

  if (!host) {
    return "http://localhost:3000"
  }

  return `${protocol}://${host}`
}

function defaultCarsResponse(params: Record<string, string>) {
  const page = Number(params.page ?? DEFAULT_PAGE)
  const pageSize = Number(params.page_size ?? DEFAULT_PAGE_SIZE)

  return {
    items: [],
    meta: {
      page,
      pageSize,
      total: 0,
      totalPages: 1,
    },
  }
}

async function resolveSearchParams(
  source?: SearchParamsValue | Promise<SearchParamsValue>
): Promise<SearchParamsValue> {
  if (!source) {
    return {}
  }

  if (typeof (source as Promise<SearchParamsValue>).then === "function") {
    return (await source) ?? {}
  }

  return source ?? {}
}
