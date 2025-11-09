import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

type VehicleDetails = {
  make: string
  model: string
  year: number
  submodel?: string | null
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
    const authorizationHeader = request.headers.get("authorization")

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Missing or invalid authorization token." }, { status: 401 })
    }

    const accessToken = authorizationHeader.replace("Bearer", "").trim()
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

    if (!vehicle?.make || !vehicle?.model || !vehicle?.year) {
      return NextResponse.json({ message: "Vehicle make, model, and year are required." }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return NextResponse.json({ message: "Unable to verify user." }, { status: 401 })
    }

    let carQuery = supabase
      .from("toyota_trim_specs")
      .select("trim_id")
      .eq("make", vehicle.make)
      .eq("model", vehicle.model)
      .eq("year", vehicle.year)

    if (vehicle.submodel) {
      carQuery = carQuery.eq("submodel", vehicle.submodel)
    }

    if (vehicle.trim) {
      carQuery = carQuery.eq("trim", vehicle.trim)
    }

    const { data: car, error: carError } = await carQuery.maybeSingle()

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
      vehicle_make: vehicle.make,
      vehicle_model: vehicle.model,
      vehicle_year: vehicle.year,
      vehicle_submodel: vehicle.submodel,
      vehicle_trim: vehicle.trim,
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


