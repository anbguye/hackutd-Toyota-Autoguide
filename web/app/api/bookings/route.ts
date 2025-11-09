import { NextResponse } from "next/server"

import { createSsrClient } from "@/lib/supabase/server"

type VehicleDetails = {
  trimId: number
  make?: string | null
  model?: string | null
  year?: number | null
  trim?: string | null
}

type BookingPayload = {
  contactName: string
  contactEmail: string
  contactPhone: string
  preferredLocation: string
  bookingDateTime: string
  vehicle: VehicleDetails
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as BookingPayload | null

    if (!payload) {
      return NextResponse.json({ message: "Request body is required." }, { status: 400 })
    }

    const { contactName, contactEmail, contactPhone, preferredLocation, bookingDateTime, vehicle } = payload

    if (!contactName || !contactEmail || !contactPhone) {
      return NextResponse.json({ message: "Contact name, email, and phone are required." }, { status: 400 })
    }

    if (!preferredLocation) {
      return NextResponse.json({ message: "Preferred location is required." }, { status: 400 })
    }

    if (!bookingDateTime) {
      return NextResponse.json({ message: "Booking date and time are required." }, { status: 400 })
    }

    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle details are required." }, { status: 400 })
    }

    const trimId = Number(vehicle.trimId)

    if (!Number.isInteger(trimId) || trimId <= 0) {
      return NextResponse.json({ message: "A valid trim_id must be provided." }, { status: 400 })
    }

    const supabase = await createSsrClient();
    const {
      data: { user: cookieUser },
      error: cookieUserError,
    } = await supabase.auth.getUser();

    let user = cookieUser
    let userError = cookieUserError

    if (!user) {
      const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization")
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null

      if (token) {
        const {
          data: { user: headerUser },
          error: headerError,
        } = await supabase.auth.getUser(token)

        if (headerUser) {
          user = headerUser
          userError = null
        } else {
          userError = headerError
        }
      }
    }

    if (userError || !user) {
      if (userError) {
        console.error("Failed to verify user:", userError)
      }
      return NextResponse.json({ message: "Unable to verify user." }, { status: 401 })
    }

    const { data: car, error: carError } = await supabase
      .from("toyota_trim_specs")
      .select("trim_id")
      .eq("trim_id", trimId)
      .maybeSingle()

    if (carError) {
      console.error("Failed to locate car:", carError)
      return NextResponse.json({ message: "Unable to locate vehicle in inventory." }, { status: 500 })
    }

    if (!car?.trim_id) {
      return NextResponse.json(
        { message: "The selected vehicle could not be found. Please choose another model." },
        { status: 404 }
      )
    }

    const baseInsert = {
      user_id: user.id,
      car_id: car.trim_id,
      preferred_location: preferredLocation,
      booking_date: bookingDateTime,
      status: "pending" as const,
    }

    const extendedInsert = {
      ...baseInsert,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      vehicle_make: vehicle.make ?? null,
      vehicle_model: vehicle.model ?? null,
      vehicle_year: typeof vehicle.year === "number" ? vehicle.year : null,
      vehicle_trim: vehicle.trim ?? null,
    }

    const { data: booking, error: insertError } = await supabase
      .from("test_drive_bookings")
      .insert(extendedInsert)
      .select("*")
      .single()

    if (insertError) {
      console.warn("Falling back to base booking insert due to error:", insertError)
      const { data: fallbackBooking, error: fallbackError } = await supabase
        .from("test_drive_bookings")
        .insert(baseInsert)
        .select("*")
        .single()

      if (fallbackError) {
        console.error("Failed to insert booking:", fallbackError)
        return NextResponse.json({ message: "Unable to create booking. Please try again later." }, { status: 500 })
      }

      return NextResponse.json({ booking: fallbackBooking })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Unexpected error creating booking:", error)
    return NextResponse.json({ message: "Something went wrong while creating the booking." }, { status: 500 })
  }
}


