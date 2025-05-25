import { MoralisNextApi } from "@moralisweb3/next";

// Moralis Next API...
export default MoralisNextApi({
    apiKey: process.env.MORALIS_API_KEY || '',
    authentication: {
        domain: "",
        uri: process.env.NEXTAUTH_URL || '',
        timeout: 120,
    },
});