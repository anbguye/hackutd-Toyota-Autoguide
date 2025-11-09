import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import type { Car, CarsResponse } from "@/lib/supabase/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables for anonymous client.")
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50

const SELECT_COLUMNS = `
  trim_id,
  model_year,
  make,
  model,
  submodel,
  trim,
  description,
  msrp,
  body_type,
  body_seats,
  drive_type,
  engine_type,
  fuel_type,
  city_mpg,
  highway_mpg,
  combined_mpg,
  image_url
`

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    const q = sanitizeSearch(searchParams.get("q"))
    const type = sanitizeSearch(searchParams.get("type"))
    const seatsQuery = sanitizeSearch(searchParams.get("seats"))
    const sort = sanitizeSearch(searchParams.get("sort")) || "price-low"

    const budgetMin = parseNumber(searchParams.get("budget_min"))
    const budgetMax = parseNumber(searchParams.get("budget_max"))

    const page = clamp(parseNumber(searchParams.get("page")) ?? 1, 1, Number.MAX_SAFE_INTEGER)
    const pageSize = clamp(parseNumber(searchParams.get("page_size")) ?? DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)

    let query = supabase.from("toyota_trim_specs").select(SELECT_COLUMNS)

    if (q) {
      const likeValue = `%${q}%`
      query = query.or(
        ["make", "model", "trim", "submodel", "description"].map((field) => `${field}.ilike.${likeValue}`).join(",")
      )
    }

    if (type && type !== "all") {
      query = query.ilike("body_type", `%${type}%`)
    }

    if (seatsQuery && seatsQuery !== "any") {
      if (seatsQuery === "7+" || seatsQuery === "7plus") {
        query = query.gte("body_seats", 7)
      } else {
        const seats = parseNumber(seatsQuery)
        if (typeof seats === "number") {
          query = query.eq("body_seats", seats)
        }
      }
    }

    if (typeof budgetMin === "number") {
      query = query.gte("msrp", budgetMin)
    }

    if (typeof budgetMax === "number") {
      query = query.lte("msrp", budgetMax)
    }

    const { data, error } = await query

    if (error) {
      console.error("[api/cars] Supabase query failed:", error)
      return NextResponse.json({ message: "Unable to fetch cars." }, { status: 500 })
    }

    const rows = Array.isArray(data) ? data : []
    const uniqueRows = pickCheapestTrimPerModel(rows)
    const sortedRows = sortRows(uniqueRows, sort)

    const total = sortedRows.length
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize)
    const currentPage = Math.min(Math.max(page, 1), totalPages)
    const fromIndex = (currentPage - 1) * pageSize
    const toIndex = fromIndex + pageSize
    const paginatedRows = sortedRows.slice(fromIndex, toIndex)
    const items = paginatedRows.map(mapRowToCar)

    const response: CarsResponse = {
      items,
      page: currentPage,
      pageSize,
      total,
      totalPages,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    })
  } catch (error) {
    console.error("[api/cars] Unexpected error:", error)
    return NextResponse.json({ message: "Unexpected error fetching cars." }, { status: 500 })
  }
}

function sanitizeSearch(value: string | null) {
  return value?.trim() || ""
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function mapRowToCar(row: Record<string, any>): Car {
  const nameParts = [row.make, row.model, row.trim].filter(Boolean)
  const msrp = normalizeMsrp(row.msrp)
  const image = row.image_url

  return {
    id: String(row.trim_id ?? crypto.randomUUID()),
    name: nameParts.length
      ? nameParts.join(" ").replace(/\s+/g, " ").trim()
      : typeof row.description === "string"
        ? row.description
        : "Toyota Model",
    year: toNumber(row.model_year) ?? new Date().getFullYear(),
    type: row.body_type ?? undefined,
    seats: toNumber(row.body_seats),
    mpgCity: toNumber(row.city_mpg),
    mpgHighway: toNumber(row.highway_mpg),
    msrp,
    drive: row.drive_type ?? undefined,
    powertrain: row.engine_type ?? row.fuel_type ?? undefined,
    image: image ?? undefined,
  }
}

function normalizeMsrp(msrp: unknown) {
  const value = toNumber(msrp)
  if (typeof value === "number") {
    return Math.round(value)
  }
  return undefined
}

function pickCheapestTrimPerModel(rows: Record<string, any>[]) {
  const best = new Map<string, Record<string, any>>()

  for (const row of rows) {
    const key = buildModelKey(row)
    const msrp = toNumber(row.msrp) ?? Number.POSITIVE_INFINITY

    if (!key) {
      continue
    }

    const current = best.get(key)

    if (!current) {
      best.set(key, row)
      continue
    }

    const currentMsrp = toNumber(current.msrp) ?? Number.POSITIVE_INFINITY

    if (msrp < currentMsrp) {
      best.set(key, row)
    }
  }

  return Array.from(best.values())
}

function sortRows(rows: Record<string, any>[], sort: string) {
  const copy = [...rows]

  switch (sort) {
    case "price-high":
      return copy.sort((a, b) => comparePrice(b, a))
    case "mpg":
      return copy.sort((a, b) => compareMpg(b, a) || compareName(a, b))
    case "name":
      return copy.sort(compareName)
    case "price-low":
    default:
      return copy.sort((a, b) => comparePrice(a, b))
  }
}

function comparePrice(a: Record<string, any>, b: Record<string, any>) {
  const aPrice = toNumber(a.msrp)
  const bPrice = toNumber(b.msrp)

  if (aPrice === undefined && bPrice === undefined) {
    return compareName(a, b)
  }
  if (aPrice === undefined) return 1
  if (bPrice === undefined) return -1
  if (aPrice === bPrice) return compareName(a, b)
  return aPrice - bPrice
}

function compareMpg(a: Record<string, any>, b: Record<string, any>) {
  const scoreA = getMpgScore(a)
  const scoreB = getMpgScore(b)

  if (scoreA === scoreB) {
    return 0
  }
  return scoreA > scoreB ? 1 : -1
}

function compareName(a: Record<string, any>, b: Record<string, any>) {
  const nameA = buildDisplayName(a)
  const nameB = buildDisplayName(b)

  return nameA.localeCompare(nameB, undefined, { sensitivity: "base" })
}

function getMpgScore(row: Record<string, any>) {
  return (
    toNumber(row.highway_mpg) ??
    toNumber(row.city_mpg) ??
    toNumber(row.combined_mpg) ??
    Number.NEGATIVE_INFINITY
  )
}

function buildModelKey(row: Record<string, any>) {
  const year = toNumber(row.model_year)
  const make = normalizeString(row.make)
  const model =
    normalizeString(row.model) ||
    normalizeString(row.submodel) ||
    normalizeString(row.description) ||
    (row.trim_id ? String(row.trim_id) : "")

  if (!model) {
    return undefined
  }

  return `${year ?? ""}|${make}|${model}`
}

function buildDisplayName(row: Record<string, any>) {
  const parts = [row.make, row.model, row.trim].filter(Boolean)
  if (parts.length === 0 && row.description) {
    return String(row.description)
  }
  return parts.join(" ").trim()
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }
  return value.trim().toLowerCase()
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

