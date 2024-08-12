import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import { MessageInstance } from "@/app/types/types";
import connectToDatabase from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";


export async function GET() {
  const session = await getServerSession(options);

  if (!session) {
      return new Response(`User not authenticated`, { status: 401 });
  }

  if (session.user?.role !== "admin") {
      console.error(`Session user is not authorised`);
      return new Response(`User not authorised`, { status: 403 });
  }

  try {
      await connectToDatabase();
  } catch (error: any) {
      console.error("Couldn't connect to database");
      throw new Error(error.message);
  }

  try {
      const feedbacks = await getFeedbacks();
      const { upvoted, downvoted, unvoted } = feedbacks;

      return Response.json({ upvoted, downvoted, unvoted });
  } catch (error: any) {
      console.error(`Couldn't retrieve feedback messages`);
      throw new Error(error.message);
  }
}

const getFeedbacks = async () => {
  try {
      const feedbackMessages = await Chat.aggregate([
          { $unwind: '$messages' },
          {
              $facet: {
                  upvoted: [
                      { $match: { 'messages.feedback.upvoted': true } },
                      {
                          $project: {
                              _id: 0,
                              id: '$messages.id',
                              message: '$messages.text',
                              threadID: 1,
                              user: 1,
                              title: 1,
                              feedback: '$messages.feedback',
                              timestamp: '$messages.timestamp',
                          },
                      },
                  ],
                  downvoted: [
                      { $match: { 'messages.feedback.downvoted': true } },
                      {
                          $project: {
                              _id: 0,
                              id: '$messages.id',
                              message: '$messages.text',
                              threadID: 1,
                              user: 1,
                              title: 1,
                              feedback: '$messages.feedback',
                              timestamp: '$messages.timestamp',
                          },
                      },
                  ],
                  unvoted: [
                      { $match: { 
                        $and: [
                            { 'messages.feedback.upvoted': { $ne: true } },
                            { 'messages.feedback.downvoted': { $ne: true } }
                        ]
                      }
                    },
                      {
                          $project: {
                              _id: 0,
                              id: '$messages.id',
                              message: '$messages.text',
                              threadID: 1,
                              user: 1,
                              title: 1,
                              feedback: '$messages.feedback',
                              timestamp: '$messages.timestamp',
                          },
                      },
                  ],
              },
          },
      ]);

      // The facet stage returns an array with a single object containing the upvoted, downvoted, and unvoted arrays
      const result = feedbackMessages[0];
      return {
          upvoted: result.upvoted,
          downvoted: result.downvoted,
          unvoted: result.unvoted,
      };
  } catch (error: any) {
      console.error(`Couldn't retrieve feedback messages`);
      throw new Error(error.message);
  }
}

// const getUpvoted = async () => {  
//     try {
//         const upvotedMessages: MessageInstance[] = await Chat.aggregate([
//           { $unwind: '$messages' },
//           { $match: { 'messages.feedback.upvoted': true } },
//           {
//             $project: {
//               _id: 0,
//               id: '$messages.id',
//               message: '$messages.text',
//               threadID: 1,
//               user: 1,
//               title: 1,
//               feedback: '$messages.feedback',
//               timestamp: '$messages.timestamp',
//             },
//           },
//         ]);
//         return upvotedMessages;
//     } catch (error: any) {
//       console.error(`Couldn't retrieve upvoted messages`);
//       throw new Error(error.message);
//     }  
// }

// const getDownvoted = async () => {  
//   try {
//       const upvotedMessages: MessageInstance[] = await Chat.aggregate([
//         { $unwind: '$messages' },
//         { $match: { 'messages.feedback.downvoted': true } },
//         {
//           $project: {
//             _id: 0,
//             id: '$messages.id',
//             message: '$messages.text',
//             threadID: 1,
//             user: 1,
//             title: 1,
//             feedback: '$messages.feedback',
//             timestamp: '$messages.timestamp',
//           },
//         },
//       ]);
//       return upvotedMessages;
//   } catch (error: any) {
//     console.error(`Couldn't retrieve upvoted messages`);
//     throw new Error(error.message);
//   }  
// }

// const getUnvoted = async () => {  
//   try {
//       const upvotedMessages: MessageInstance[] = await Chat.aggregate([
//         { $unwind: '$messages' },
//         { $match: { 'messages.feedback.upvoted': false, 'messages.feedback.downvoted': false } },
//         {
//           $project: {
//             _id: 0,
//             id: '$messages.id',
//             message: '$messages.text',
//             threadID: 1,
//             user: 1,
//             title: 1,
//             feedback: '$messages.feedback',
//             timestamp: '$messages.timestamp',
//           },
//         },
//       ]);
//       return upvotedMessages;
//   } catch (error: any) {
//     console.error(`Couldn't retrieve upvoted messages`);
//     throw new Error(error.message);
//   }  
// }