export interface CandidateData {
    fullName: string;
    email: string;
    phone?: string;
    department?: string;
    address?: string;
    [key: string]: any;
}

// This URL will need to be replaced with the deployed Web App URL from Google Apps Script
// We'll use a placeholder or an environment variable
export const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "YOUR_GOOGLE_SCRIPT_URL_HERE";

export const googleSheets = {
    /**
     * Submits candidate registration data to Google Sheets
     */
    async submitCandidate(data: CandidateData) {
        if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("https://script.google.com/macros/s/AKfycbxyxH7pWo3_et4AQc7Orn5XFvzRjIbs021B7aOtIZyfyy53w8-ArIz6Ts9BLfhDdVFlww/exec")) {
            console.warn("Google Script URL is not configured.");
            // Simulate success for demo if URL is missing, but warn
            // return { success: true, message: "Simulated success (Script URL missing)" };
        }

        try {
            // We use 'no-cors' mode because Google Apps Script Web Apps don't easily support CORS 
            // without redirects that fetch doesn't follow seamlessly in all envs, 
            // BUT for a POST request to receive data, we usually need correct CORS setup in the script 
            // OR we just send it and ignore the response in 'no-cors' mode (opaque response).
            // However, to get a real success/fail response, the Script must handle OPTION/POST correctly.
            // For this implementation, we'll try a standard POST. If CORS fails, we might need 'no-cors'.

            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8", // text/plain avoids preflight OPTIONS request in some cases
                },
                body: JSON.stringify({
                    action: "register_candidate",
                    data: data,
                }),
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error submitting to Google Sheets:", error);
            throw error;
        }
    },

    /**
     * Submits candidate documents (metadata + file content)
     * Note: Sending large files via JSON/text can be slow/limited. 
     */
    async submitCandidateDocuments(data: CandidateData, files: Record<string, { name: string, type: string, base64: string }>) {
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify({
                    action: "submit_documents",
                    data: data,
                    files: files
                }),
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error submitting documents:", error);
            throw error;
        }
    }
};
