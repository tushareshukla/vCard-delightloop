import { config } from "./config";

const getBackendApiBaseUrl = () => {
    try{
        const baseUrl = config.BACKEND_URL;
        return baseUrl;
    }catch(error){
        console.error('Error fetching base URL:', error);
        throw new Error('BACKEND_URL is not defined in environment variables');
    }
};

export default getBackendApiBaseUrl;
