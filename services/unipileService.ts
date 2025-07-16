import axios from "axios";
import User from "@/models/User";
import UnipileResponse from "@/models/UnipileResponse";

const UNIPILE_BASE_URL:any = process.env.UNIPILE_BASE_URL;
const UNIPILE_API_KEY:any = process.env.UNIPILE_API_KEY;
const UNIPILE_CALL_BACK_ACCOUNT_LINK:any = process.env.UNIPILE_CALL_BACK_ACCOUNT_LINK;


export const getUnipileAccountAddLink = async (uniqueId:string,email_expire_date:string) => {
  try {
    console.log("uniqueId: ", uniqueId);
    const date = new Date();
    const nextYearDate = new Date(date.setFullYear(date.getFullYear() + 1)).toISOString();
    
    const newAccount = {
      type:"create",
      name: uniqueId,
      providers: "*",
      api_url: UNIPILE_BASE_URL,
      expiresOn: email_expire_date,
      notify_url: UNIPILE_CALL_BACK_ACCOUNT_LINK,
    };

    // Send API request to Unipile
    const response:any = await axios.post(
      `${UNIPILE_BASE_URL}/api/v1/hosted/accounts/link`,
      newAccount,
      {
        headers: {
          "X-API-KEY": UNIPILE_API_KEY,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Response from Unipile: ", response.status);
    return response;
  } 
  catch (error:any) {
    try{
      return error.response;
    }
    catch(e){
      return null;
    }
  }
};


export const updateUnitipleAccountId = async (userId:string) => {
  try {
        const unipileResponse = await UnipileResponse.findOne({name: userId});
        if (unipileResponse.account_id) {
            var edituser = await User.findById(userId);
            edituser.set({ unipile: {account_id: unipileResponse?.account_id} });
            edituser.save();
            
            if(edituser){
                console.log('need to delete record from unipile response');
                await UnipileResponse.findByIdAndDelete(unipileResponse._id);
            }
        }
  } 
  catch (error:any) {
    console.log("Error updating Unipile account: ", error);
  }
};
