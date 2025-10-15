import { Request, Response } from 'express';
import fetch from 'node-fetch';

const getApiKey = () => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('Google API Key is not configured on the server.');
    }
    return apiKey;
}

export const generateScenarioImage = async (req: Request, res: Response) => {
    const { prompt: userPrompt } = req.body;

    try {
        const apiKey = getApiKey();
        if (!userPrompt) {
            return res.status(400).json({ message: 'Prompt is required.' });
        }

        const fullPrompt = `a realistic and cozy ${userPrompt} with modern furniture, plants, and other decorations. The walls are completely empty and clean, ready for art to be placed on them. The room has natural lighting.`;
        const payload = { instances: [{ prompt: fullPrompt }], parameters: { "sampleCount": 1 } };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error('Google API Error (not OK):', apiResponse.status, apiResponse.statusText, errorBody);
            throw new Error(`Error from Google API: ${apiResponse.status} ${apiResponse.statusText}`);
        }

        const rawResult = await apiResponse.text();
        console.log('Google API Raw Response:', rawResult);
        const result = JSON.parse(rawResult);

        if (result.predictions && result.predictions[0].bytesBase64Encoded) {
            res.json({ base64Data: result.predictions[0].bytesBase64Encoded });
        } else {
            throw new Error('No image data found in Google API response.');
        }

    } catch (error: any) {
        console.error("Error generating image:", error);
        res.status(500).json({ message: `Failed to generate image: ${error.message}` });
    }
};

export const generateShadows = async (req: Request, res: Response) => {
    const { image, mask } = req.body; // Expecting base64 encoded images

    try {
        const apiKey = getApiKey();
        if (!image || !mask) {
            return res.status(400).json({ message: 'Image and mask data are required.' });
        }

        const prompt = "Add realistic shadows to the picture frames on the wall, considering the lighting of the room.";
        
        const payload = {
            instances: [{
                prompt: prompt,
                image: { bytesBase64Encoded: image },
                mask: { image: { bytesBase64Encoded: mask } }
            }],
            parameters: { "sampleCount": 1 }
        };

        // NOTE: Using a hypothetical endpoint for image inpainting/editing.
        // The actual model name and API structure might differ.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error('Google API Error (not OK):', apiResponse.status, apiResponse.statusText, errorBody);
            throw new Error(`Error from Google API: ${apiResponse.status} ${apiResponse.statusText}`);
        }

        const rawResult = await apiResponse.text();
        console.log('Google API Raw Response (Shadows):', rawResult);
        const result = JSON.parse(rawResult);

        if (result.predictions && result.predictions[0].bytesBase64Encoded) {
            res.json({ base64Data: result.predictions[0].bytesBase64Encoded });
        } else {
            throw new Error('No image data found in Google API response.');
        }

    } catch (error: any) {
        console.error("Error generating shadows:", error);
        res.status(500).json({ message: `Failed to generate shadows: ${error.message}` });
    }
};