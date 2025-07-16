import { NextResponse } from "next/server";
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Get all jobs for this list
    const jobs = await db.collection('lookalikeJobs')
      .find({ listId: params.id })
      .sort({ createdAt: -1 })
      .toArray();

    // Get list details
    const list = await db.collection('lists')
      .findOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({ 
      success: true,
      data: {
        list: {
          _id: list?._id,
          status: list?.status,
          totalRecipients: list?.recipients?.length || 0
        },
        jobs: jobs.map(job => ({
          _id: job._id,
          status: job.status,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          error: job.error,
          sourceProfiles: job.sourceProfiles,
          targetCount: job.targetCount,
          resultCount: job.result?.length || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get debug information' 
    }, { status: 500 });
  }
} 