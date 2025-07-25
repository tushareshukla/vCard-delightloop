import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import { validateLogin } from "@/utils/auth";
import User from "@/models/User";
import jwt, { SignOptions } from "jsonwebtoken";
import VCard, { IVCard } from "@/models/VCard";

export async function POST(request: Request) {
  const logs: string[] = [];
  const addLog = (message: string) => {
    logs.push(message);
    console.log(message); // Server-side log
  };

  try {
    const referer =
      request.headers.get("referer") || request.headers.get("referrer");
    addLog(`Request came from: ${referer}`);
    addLog("1. Login request received");
    await dbConnect();
    addLog("2. Database connected");

    const { email, password } = await request.json();
    addLog(`3. Parsed login request for email: ${email}`);

    // Check if user has LinkedIn credentials and is trying to login with email/password
    addLog("4. Checking if user has LinkedIn credentials");
    const userWithLinkedIn = await User.findOne({ email });

    if (userWithLinkedIn && userWithLinkedIn.linkedinCreds?.linkedinEmail) {
      addLog(
        `5A. User has LinkedIn credentials, linkedinEmail: ${userWithLinkedIn.linkedinCreds.linkedinEmail}`
      );

      // Check if they're trying to login with either their regular email or LinkedIn email
      if (
        email === userWithLinkedIn.email ||
        email === userWithLinkedIn.linkedinCreds.linkedinEmail
      ) {
        addLog(
          "5B. User with LinkedIn credentials attempting email/password login"
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "This account was created using LinkedIn. Please sign in with LinkedIn to continue.",
            loginMethod: "linkedin",
            logs: [...logs],
          },
          { status: 400 }
        );
      }
    }

    addLog(
      "5C. No LinkedIn credentials found or different email, proceeding with standard login"
    );
    addLog("6. Calling validateLogin");
    const result = await validateLogin(email, password);
    addLog(`7. ValidateLogin result: ${result.success ? "success" : "failed"}`);

    if (!result.success) {
      addLog(`8A. Login failed: ${result.message}`);
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          logs: [...logs, ...(result.logs || [])],
        },
        { status: 401 }
      );
    }

    addLog("8B. Login successful, updating last login time and login count");
    // Update last login time and increment login count if it's a database user
    if (result.user.id) {
      const updatedUser = await User.findByIdAndUpdate(
        result.user.id,
        {
          last_loggedin: new Date(),
          $inc: { login_count: 1 },
        },
        { new: true } // Return the updated document
      );

      // Update the login_count in the result to reflect the new value
      if (updatedUser) {
        result.user.login_count = updatedUser.login_count;
      }

      addLog("9. Updated last login time and incremented login count");
    }

    // Check if user already has a VCard
    const existingUserVCard = await VCard.findOne({
      userId: result.user.id,
      isDeleted: false,
      isActive: true,
    });

    // If user doesn't have a VCard, create one
    if (!existingUserVCard) {
      const newVCard = new VCard({
        handle: `${result.user.firstName.replace(/\s+/g, '')}${Math.random().toString(36).substring(2, 7)}`,
        userId: result.user.id,
        fullName: `${result.user.firstName} ${result.user.lastName}`,
        nfcEnabled: true,
        isActive: true,
        links: [{
            type: "Email",
            value: result.user.email,
            icon: "Email",
            removedIcon: false,
            isVisible: true,
            lastUpdated: new Date()
          }],
        isDeleted: false
      });

      await newVCard.save();
      addLog(`Created new VCard for user ${result.user.id}`);
    }

    // Check for VCard referral parameters for new users only (vcr + vid)
    let referredVCard: IVCard | null = null;

    if (referer) {
      const refererUrl = new URL(referer);
      const vcr = refererUrl.searchParams.get("vcr");
      const vid = refererUrl.searchParams.get("vid");
      addLog(`vcr: ${vcr}, vid: ${vid}`);

      // Only handle referral assignment for new users with both vcr and vid
      if (vcr && vid) {
        try {
          // Search VCard collection for matching key (vcr) and secret (vid)
          referredVCard = await VCard.findOne({
            key: vcr,
            secret: vid,
            isDeleted: false,
            isActive: true,
          });

          if (referredVCard) {
            addLog("Found matching VCard:" + referredVCard._id);
          } else {
            addLog("No matching VCard found for vcr/vid");
          }
        } catch (error) {
          addLog("Error searching for VCard:" + error);
        }
      }
      if(vcr && !vid){
       const existingVCardUserAssignment = await VCard.findOne({
            key: vcr,
            isDeleted: false,
            isActive: true,
          });
          if (existingVCardUserAssignment) {
            addLog("Existing VCard user assignment found");
            // Find the existing user's VCard
            // const existingUser = await VCard.findOne({
            //   userId: result.user.id,
            //   isDeleted: false,
            //   isActive: true,
            // });
            // If user has a VCard and it doesn't have a referredByVcardId
            // if (existingUser &&
            //     !existingUser.referredByVcardId &&
            //     (existingVCardUserAssignment._id.toString() !== existingUser._id.toString()) &&
            //     (existingVCardUserAssignment.referredByVcardId?.toString() !== existingUser._id.toString())) {
            //   // Optionally, you can add the assignment logic here
            //   await VCard.findByIdAndUpdate(
            //     existingUser._id,
            //     { referredByVcardId: existingVCardUserAssignment._id },
            //     { new: true }
            //   );
            // }

            // If user doesn't have a VCard, create one
            // if (!existingUser) {
            //   const newVCard = new VCard({
            //     handle: `${result.user.firstName}${Math.random().toString(36).substring(2, 7)}`,
            //     userId: result.user.id,
            //     fullName: `${result.user.firstName} ${result.user.lastName}`,
            //     referredByVcardId: existingVCardUserAssignment._id,
            //     nfcEnabled: true,
            //     isActive: true,
            //     isDeleted: false,
            //     links: [{
            //       type: "Email",
            //       value: result.user.email,
            //       icon: "Email",
            //       removedIcon: false,
            //       isVisible: true,
            //       lastUpdated: new Date()
            //     }]
            //   });

            //   await newVCard.save();
            //   addLog(`Created new VCard for user ${result.user.id} referred by VCard ${existingVCardUserAssignment._id}`);
            // }
          }
      }
    }


    // Associate user with referred VCard if found and not already assigned
    // But only if the user doesn't already have a pre-existing VCard
    if (referredVCard && !referredVCard.userId) {
      try {
        // Check if user already has a VCard
        const existingUserVCard = await VCard.findOne({
          userId: result.user.id,
          isDeleted: false,
          isActive: true,
        });

        if (existingUserVCard) {
          addLog(
            `User ${result.user.id} already has an existing VCard ${existingUserVCard._id}, skipping association with referred VCard`
          );
        } else {
          // User doesn't have a VCard, proceed with association
          await VCard.findByIdAndUpdate(
            referredVCard._id,
            {
              userId: result.user.id,
            },
            { new: true }
          );
          addLog(
            `Successfully associated user ${result.user.id} with VCard ${referredVCard._id}`
          );
        }
      } catch (error) {
        addLog("Error associating user with VCard:" + error);
      }
    } else if (referredVCard && referredVCard.userId) {
      addLog(
        `VCard ${referredVCard._id} already has userId ${referredVCard.userId}, skipping association`
      );
    }

    addLog("10. Sending success response");
    const token = getToken(result.user);

    return NextResponse.json({
      success: true,
      data: {
        ...result.user,
        organization_id: result.user.organization_id,
        organizationId: result.user.organization_id,
        session_token: token,
      },
      auth: {
        token: "true", // You might want to use a real JWT token here
        email: result.user.email,
        userId: result.user.id,
        organization_id: result.user.organization_id,
        organizationId: result.user.organization_id,
      },
      message: "Login successful",
      logs: [...logs, ...(result.logs || [])],
    });
  } catch (error) {
    addLog(`ERROR: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to login",
        logs,
      },
      { status: 500 }
    );
  }
}

const getToken = (user: any) => {
  try {
    const JWT_SECRET = "delightloop_api_secret_JWTSecret";
    const payload = { _id: user.id.toString() };
    const JWT_SIGN_OPTIONS: SignOptions = {
      algorithm: "HS256", // Explicitly set the algorithm
      expiresIn: "1d",
    };

    const token = jwt.sign(payload, JWT_SECRET, JWT_SIGN_OPTIONS);
    //alert(token);
    return token;
  } catch (error) {
    console.log("Error generating token: ", error);
    return "error";
  }
};
