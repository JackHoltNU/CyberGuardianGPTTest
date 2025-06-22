import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/app/lib/mongodb";
import ConversationStarter from "@/app/models/ConversationStarter";

// GET - Fetch conversation starters (with optional random selection)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const random = searchParams.get('random');
    const limit = searchParams.get('limit');
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // default to true

    await connectToDatabase();
    
    let query = activeOnly ? { isActive: true } : {};
    
    if (random === 'true') {
      // Get random conversation starters
      const limitNum = limit ? parseInt(limit) : 3;
      const starters = await ConversationStarter.aggregate([
        { $match: query },
        { $sample: { size: limitNum } }
      ]);
      
      return NextResponse.json({
        success: true,
        starters
      });
    } else {
      // Get all conversation starters
      const starters = await ConversationStarter.find(query)
        .sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        starters
      });
    }

  } catch (error) {
    console.error("Error fetching conversation starters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new conversation starter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, isActive } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const starter = new ConversationStarter({
      text: text.trim(),
      isActive: isActive !== undefined ? isActive : true
    });

    await starter.save();

    return NextResponse.json({
      success: true,
      message: "Conversation starter created successfully",
      starter
    });

  } catch (error) {
    console.error("Error creating conversation starter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update conversation starter
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Starter ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { text, isActive } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const starter = await ConversationStarter.findByIdAndUpdate(
      id,
      {
        text: text.trim(),
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!starter) {
      return NextResponse.json(
        { error: "Conversation starter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversation starter updated successfully",
      starter
    });

  } catch (error) {
    console.error("Error updating conversation starter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete conversation starter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Starter ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const starter = await ConversationStarter.findByIdAndDelete(id);

    if (!starter) {
      return NextResponse.json(
        { error: "Conversation starter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversation starter deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting conversation starter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}