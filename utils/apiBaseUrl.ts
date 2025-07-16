

const getBackendApiBaseUrl = () => {
    try{
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        return baseUrl;
    }catch(error){
        console.error('Error fetching base URL:', error);
        throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined in environment variables');
        return null;
    }
}

export default getBackendApiBaseUrl;
