import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserProgress from "../../models/UserProgress";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const userProgress = await UserProgress.findOne({ username });
    
    if (!userProgress) {
      return NextResponse.json(
        { error: "User progress not found. Please initialize progress first." },
        { status: 404 }
      );
    }

    // Check if study is already complete
    if (userProgress.isStudyComplete) {
      return NextResponse.json({ 
        message: "Study already complete",
        userProgress 
      });
    }

    const today = new Date();
    const todayDateString = today.toDateString();
    
    // Check if user has already interacted today
    const todayInteraction = userProgress.dailyInteractions.find(
      (interaction: any) => interaction.date.toDateString() === todayDateString
    );

    if (todayInteraction) {
      // User has already interacted today, just increment the count
      todayInteraction.interactionCount += 1;
      await userProgress.save();
      
      return NextResponse.json({ 
        message: "Daily interaction recorded",
        userProgress,
        isNewDay: false
      });
    }

    // This is the first interaction of today - check if it's a different calendar day
    // Find the most recent completed day
    const lastInteraction = userProgress.dailyInteractions
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    let isValidNewDay = true;
    
    if (lastInteraction) {
      const lastInteractionDate = new Date(lastInteraction.date);
      const todayDate = new Date(today);
      
      // Convert both dates to GMT and compare calendar days only
      const lastDateGMT = new Date(lastInteractionDate.toISOString().split('T')[0]);
      const todayDateGMT = new Date(todayDate.toISOString().split('T')[0]);
      
      // If it's the same calendar day (GMT), it's not a new day
      if (lastDateGMT.getTime() === todayDateGMT.getTime()) {
        isValidNewDay = false;
      }
    }
    
    if (!isValidNewDay) {
      // Same calendar day as last interaction, just increment count of most recent interaction
      if (lastInteraction) {
        lastInteraction.interactionCount += 1;
      }
      await userProgress.save();
      
      return NextResponse.json({ 
        message: "Same calendar day interaction recorded",
        userProgress,
        isNewDay: false
      });
    }
    
    // Valid new day - create new interaction
    const newInteraction = {
      day: userProgress.currentDay,
      date: today,
      interactionCount: 1,
      firstInteractionTime: today
    };
    
    userProgress.dailyInteractions.push(newInteraction);
    userProgress.completedDays += 1;
    
    // Move to next day if not complete
    if (userProgress.currentDay < 14) {
      userProgress.currentDay += 1;
    }
    
    // Check if study is now complete
    if (userProgress.completedDays >= 14) {
      userProgress.isStudyComplete = true;
    }

    await userProgress.save();

    return NextResponse.json({ 
      message: todayInteraction ? "Daily interaction recorded" : "New day completed",
      userProgress,
      isNewDay: !todayInteraction
    });
  } catch (error) {
    console.error("Error recording daily interaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}