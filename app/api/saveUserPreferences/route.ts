import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/app/lib/mongodb";
import UserPreferences from "@/app/models/UserPreferences";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, promptConfiguration } = body;

    if (!username || !promptConfiguration) {
      return NextResponse.json(
        { error: "Username and promptConfiguration are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Use upsert to create or update preferences
    const userPreferences = await UserPreferences.findOneAndUpdate(
      { username },
      { 
        username,
        promptConfiguration,
        updatedAt: new Date()
      },
      { 
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    return NextResponse.json({
      success: true,
      message: "User preferences saved successfully",
      preferences: userPreferences.promptConfiguration
    });

  } catch (error) {
    console.error("Error saving user preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}