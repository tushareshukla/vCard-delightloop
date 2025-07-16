import { NextResponse } from "next/server";
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const job = await db.collection('lookalikeJobs')
      .findOne(
        { listId: params.id },
        { sort: { createdAt: -1 } }
      );

    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: 'No job found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      status: job.status,
      result: job.status === 'completed' ? job.result : undefined,
      error: job.error
    });

  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check job status' 
    }, { status: 500 });
  }
} 