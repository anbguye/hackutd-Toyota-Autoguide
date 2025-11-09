import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

export async function GET() {
  try {
    // Fetch all cars with images
    const { data, error } = await supabase
      .from("toyota_trim_specs")
      .select("image_url")
      .not("image_url", "is", null)
      .limit(1000)

    if (error) {
      console.error("[api/cars/random] Supabase query failed:", error)
      return NextResponse.json({ image: null }, { status: 200 })
    }

    const rows = Array.isArray(data) ? data : []
    const images = rows
      .map((row) => row.image_url)
      .filter((url): url is string => typeof url === "string" && url.trim() !== "")

    if (images.length === 0) {
      return NextResponse.json({ image: null }, { status: 200 })
    }

    // Pick a random image
    const randomImage = images[Math.floor(Math.random() * images.length)]

    return NextResponse.json(
      { image: randomImage },
      {
        status: 200,
        headers: {
          "cache-control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("[api/cars/random] Unexpected error:", error)
    return NextResponse.json({ image: null }, { status: 200 })
  }
}

