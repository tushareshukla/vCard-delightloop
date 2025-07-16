import { NextResponse } from 'next/server';
import dbConnect from "@/lib/database/dbConnect";
import List from "@/models/Lists";
import LookalikeJob from "@/models/LookalikeJob";
import Campaign from "@/models/Campaign";
import Recipients from "@/models/Recipients";
import { oceanService } from '@/app/services/ocean.service';
import { linkedInService } from '@/app/services/linkedin.service';
import mongoose from 'mongoose';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { linkedinUrls, count, vendor = 'ocean', campaignId, onComplete } = await request.json();
    console.log('Creating lookalike job with:', { linkedinUrls, count, vendor, campaignId, onComplete });

    // Create a new job document
    const job = await LookalikeJob.create({
      listId: params.id,
      status: 'pending',
      sourceProfiles: linkedinUrls,
      targetCount: count,
      vendor,
      campaignId, // Store campaign ID if provided
      onComplete, // Store onComplete configuration if provided
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Created job:', { 
      jobId: job._id.toString(),
      campaignId: job.campaignId,
      onComplete: job.onComplete
    });

    // Update list status
    await List.findByIdAndUpdate(params.id, {
      status: 'processing-lookalikes'
    });

    // Start the background process
    processLookalikeJob(job._id.toString(), params.id).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      jobId: job._id.toString() 
    });

  } catch (error) {
    console.error('Error creating lookalike job:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create lookalike job' 
    }, { status: 500 });
  }
}

async function processLookalikeJob(jobId: string, listId: string) {
  let job;
  try {
    await dbConnect();
    console.log(`[Job ${jobId}] Starting background process for list ${listId}`);

    // Get job details
    job = await LookalikeJob.findById(jobId);
    if (!job) throw new Error('Job not found');
    console.log(`[Job ${jobId}] Retrieved job details:`, {
      campaignId: job.campaignId,
      onComplete: job.onComplete,
      status: job.status
    });

    // Update job status to in-progress
    await LookalikeJob.findByIdAndUpdate(jobId, {
      status: 'in-progress',
      updatedAt: new Date()
    });

    // Update list status to In-Progress
    await List.findByIdAndUpdate(listId, {
      status: 'List building..'
    });
    console.log(`[Job ${jobId}] Updated status to in-progress`);
    return;

    // Get similar profiles
    console.log(`[Job ${jobId}] Starting profile search with vendor: ${job.vendor}`);
    const service = job.vendor === 'ocean' ? oceanService : linkedInService;
    const similarProfiles = await service.findSimilarProfiles(
      job.sourceProfiles,
      job.targetCount
    );
    console.log(`[Job ${jobId}] Found ${similarProfiles.length} similar profiles`);

    const createdRecipients = [];

    // Process profiles one by one
    for (const [index, profile] of similarProfiles.entries()) {
      try {
        // Create recipient with campaign ID if provided
        const recipient = await Recipients.create({
          firstName: profile.name.split(' ')[0],
          lastName: profile.name.split(' ').slice(1).join(' '),
          mailId: profile.email,
          linkedinUrl: profile.linkedin,
          companyName: profile.company,
          jobTitle: profile.jobtitle,
          country: profile.country,
          city: profile.city,
          photo: profile.photo,
          campaignId: job.campaignId // Add campaign ID if it exists
        });

        console.log(`[Job ${jobId}] Created recipient:`, {
          recipientId: recipient._id,
          campaignId: recipient.campaignId
        });

        createdRecipients.push(recipient._id);

        // Update list with new recipient and increment counter
        await List.findByIdAndUpdate(
          listId,
          {
            $push: {
              recipients: {
                recipientId: recipient._id,
                addedAt: new Date()
              }
            },
            $inc: { 'metrics.totalRecipients': 1 }
          },
          { new: true }
        );

        console.log(`[Job ${jobId}] Added profile ${index + 1}/${similarProfiles.length}`);

        // Update job progress
        await LookalikeJob.findByIdAndUpdate(jobId, {
          $push: { result: profile },
          updatedAt: new Date()
        });

      } catch (error) {
        console.error(`[Job ${jobId}] Error processing profile ${index + 1}:`, error);
        // Continue with next profile even if one fails
      }
    }

    // Mark job as completed
    await LookalikeJob.findByIdAndUpdate(jobId, {
      status: 'completed',
      updatedAt: new Date()
    });
    console.log(`[Job ${jobId}] Completed processing all profiles`);

    // Update list status to active
    await List.findByIdAndUpdate(listId, {
      status: 'active'
    });
    console.log(`[Job ${jobId}] Updated list status to active`);

    // If campaign ID exists, update campaign and ensure all recipients are associated
    if (job.campaignId) {
      console.log(`[Job ${jobId}] Updating recipients with campaign ID:`, {
        campaignId: job.campaignId,
        recipientCount: createdRecipients.length
      });

      // Update all recipients with campaign ID (in case any were missed)
      if (createdRecipients.length > 0) {
        await Recipients.updateMany(
          { _id: { $in: createdRecipients } },
          { $set: { campaignId: job.campaignId } }
        );
        console.log(`[Job ${jobId}] Updated campaign ID for all recipients`);

        // Get the campaign to check if it's a child campaign (has parentCampaignId)
        const campaign = await Campaign.findById(job.campaignId);
        if (campaign?.parentCampaignId) {
          // This is a boost case - update both parent and child campaign statuses
          await Promise.all([
            Campaign.findByIdAndUpdate(campaign.parentCampaignId, {
              status: job.onComplete?.status || 'ready to launch'
            }),
            Campaign.findByIdAndUpdate(job.campaignId, {
              status: job.onComplete?.status || 'ready to launch',
              total_recipients: createdRecipients.length,
              'metrics.totalRecipients': createdRecipients.length
            })
          ]);
          console.log(`[Job ${jobId}] Updated both parent and child campaign statuses`);
        } else {
          // Regular case - update only this campaign
          await Campaign.findByIdAndUpdate(job.campaignId, {
            status: job.onComplete?.status || 'ready to launch',
            total_recipients: createdRecipients.length,
            'metrics.totalRecipients': createdRecipients.length
          });
          console.log(`[Job ${jobId}] Updated campaign status`);
        }
      }
    }

  } catch (error) {
    console.error(`[Job ${jobId}] Error in background process:`, error);
    await LookalikeJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      error: error.message,
      updatedAt: new Date()
    });
    console.log(`[Job ${jobId}] Updated job status to failed`);

    await List.findByIdAndUpdate(listId, {
      status: 'failed'
    });
    console.log(`[Job ${jobId}] Updated list status to failed`);

    // If campaign ID exists, update campaign status to failed
    if (job?.campaignId) {
      await Campaign.findByIdAndUpdate(job.campaignId, {
        status: 'failed'
      });
      console.log(`[Job ${jobId}] Updated campaign status to failed`);
    }
  }
}