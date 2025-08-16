import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://ipwhois.app/json/");
    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.reason || "Failed to fetch location data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      countryCode: data.country_code,
      currency: data.currency_code,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location data" },
      { status: 500 }
    );
  }
}
